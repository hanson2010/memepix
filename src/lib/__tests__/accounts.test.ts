import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FakeFirestore } from '@/test/fake-firestore'
import type { ProviderIdentity } from '@/types'

let db: FakeFirestore

vi.mock('@/lib/firebase', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/firebase')>()),
  getDb: () => db,
}))

const { resolveSignIn, claimMemes, accountExists, listIdentities, linkIdentity, getPendingMerge, executeMerge } =
  await import('@/lib/accounts')

function github(overrides: Partial<ProviderIdentity> = {}): ProviderIdentity {
  return {
    provider: 'github',
    providerAccountId: 'gh1',
    email: 'a@example.com',
    emailVerified: true,
    name: 'A',
    image: 'gh.png',
    ...overrides,
  }
}

function google(overrides: Partial<ProviderIdentity> = {}): ProviderIdentity {
  return { ...github(), provider: 'google', providerAccountId: 'go1', image: 'go.png', ...overrides }
}

beforeEach(() => {
  db = new FakeFirestore()
})

describe('resolveSignIn: one account per person', () => {
  it('creates an account for a first sign-in that does not qualify for linking', async () => {
    const accountId = await resolveSignIn(github())
    expect(await accountExists(accountId)).toBe(true)
    const identities = await listIdentities(accountId)
    expect(identities.map((i) => i.id)).toEqual(['github:gh1'])
  })

  it('signs a returning identity in to its account', async () => {
    const first = await resolveSignIn(github())
    expect(await resolveSignIn(github())).toBe(first)
  })

  it('signs either identity of an account in to the same account', async () => {
    const accountId = await resolveSignIn(github())
    expect(await resolveSignIn(google())).toBe(accountId)
    expect(await resolveSignIn(github())).toBe(accountId)
    expect(await resolveSignIn(google())).toBe(accountId)
  })

  it('keeps the account ID when the provider name, avatar or email changes', async () => {
    const accountId = await resolveSignIn(github())
    expect(await resolveSignIn(github({ name: 'B', image: 'new.png', email: 'b@example.com' }))).toBe(accountId)
    expect(db.dump('identities')['github:gh1']).toMatchObject({ name: 'B', image: 'new.png', email: 'b@example.com' })
  })
})

describe('resolveSignIn: automatic linking by verified email', () => {
  it('adds a first Google sign-in to the GitHub account with the same verified email', async () => {
    const accountId = await resolveSignIn(github({ email: 'a@example.com' }))
    expect(await resolveSignIn(google({ email: 'a@example.com' }))).toBe(accountId)
    expect((await listIdentities(accountId)).map((i) => i.id).sort()).toEqual(['github:gh1', 'google:go1'])
    expect(Object.keys(db.dump('users'))).toHaveLength(1)
  })

  it('does not link an identity whose email is unverified', async () => {
    const accountId = await resolveSignIn(github())
    expect(await resolveSignIn(google({ emailVerified: false }))).not.toBe(accountId)
  })

  it('only matches identities whose email is verified', async () => {
    const accountId = await resolveSignIn(github({ emailVerified: false }))
    expect(await resolveSignIn(google())).not.toBe(accountId)
  })

  it('links nothing when the email matches several accounts', async () => {
    const one = await resolveSignIn(github({ providerAccountId: 'gh1', emailVerified: false }))
    const two = await resolveSignIn(github({ providerAccountId: 'gh2', emailVerified: false }))
    // Both become verified later, so two accounts now share the verified email
    await resolveSignIn(github({ providerAccountId: 'gh1' }))
    await resolveSignIn(github({ providerAccountId: 'gh2' }))

    const third = await resolveSignIn(google())
    expect([one, two]).not.toContain(third)
  })
})

describe('claiming existing memes', () => {
  beforeEach(() => {
    db.collectionData('memes').set('m1', { uploadedBy: 'a@example.com' })
    db.collectionData('memes').set('m2', { uploadedBy: 'a@example.com', ownerId: 'someone-else' })
    db.collectionData('memes').set('m3', { uploadedBy: 'other@example.com' })
  })

  it('gives unowned memes with the verified email to the signing-in account', async () => {
    const accountId = await resolveSignIn(github({ email: 'a@example.com' }))
    expect(db.dump('memes').m1.ownerId).toBe(accountId)
    expect(db.dump('memes').m3.ownerId).toBeUndefined()
  })

  it('claims nothing for an unverified email', async () => {
    await resolveSignIn(github({ emailVerified: false }))
    expect(db.dump('memes').m1.ownerId).toBeUndefined()
  })

  it('does not reassign owned memes', async () => {
    await resolveSignIn(github())
    expect(db.dump('memes').m2.ownerId).toBe('someone-else')
  })

  it('claims when a returning identity becomes verified', async () => {
    const accountId = await resolveSignIn(github({ emailVerified: false }))
    expect(db.dump('memes').m1.ownerId).toBeUndefined()
    await resolveSignIn(github())
    expect(db.dump('memes').m1.ownerId).toBe(accountId)
  })

  it('matches the uploader email regardless of case', async () => {
    expect(await claimMemes('acct', 'A@EXAMPLE.COM')).toBe(1)
    expect(db.dump('memes').m1.ownerId).toBe('acct')
  })

  it('claims in batches of at most 500 writes', async () => {
    for (let i = 0; i < 1200; i++) db.collectionData('memes').set(`bulk${i}`, { uploadedBy: 'bulk@example.com' })
    expect(await claimMemes('acct', 'bulk@example.com')).toBe(1200)
    expect(db.commits).toBe(3)
  })
})

describe('linkIdentity', () => {
  it('adds an identity that has no account and claims its memes', async () => {
    db.collectionData('memes').set('m1', { uploadedBy: 'b@example.com' })
    const accountId = await resolveSignIn(github())
    expect(await linkIdentity(accountId, google({ email: 'b@example.com' }))).toEqual({ outcome: 'linked' })
    expect((await listIdentities(accountId)).map((i) => i.id).sort()).toEqual(['github:gh1', 'google:go1'])
    expect(db.dump('memes').m1.ownerId).toBe(accountId)
  })

  it('changes nothing for an identity already on this account', async () => {
    const accountId = await resolveSignIn(github())
    expect(await linkIdentity(accountId, github())).toEqual({ outcome: 'already' })
    expect(await listIdentities(accountId)).toHaveLength(1)
    expect(db.dump('pendingMerges')).toEqual({})
  })

  it('starts a pending merge for an identity on another account, without moving anything', async () => {
    const a = await resolveSignIn(github())
    const b = await resolveSignIn(google({ email: 'b@example.com' }))
    const result = await linkIdentity(a, google({ email: 'b@example.com' }))

    expect(result.outcome).toBe('merge')
    const mergeId = (result as { mergeId: string }).mergeId
    expect(db.dump('pendingMerges')[mergeId]).toMatchObject({ survivorId: a, otherId: b, identityId: 'google:go1' })
    expect((db.dump('pendingMerges')[mergeId].expiresAt as Date).getTime()).toBeGreaterThan(Date.now())
    expect(db.dump('identities')['google:go1'].accountId).toBe(b)
  })

  it('reports an account that no longer exists', async () => {
    expect(await linkIdentity('missing', google())).toEqual({ outcome: 'gone' })
    expect(db.dump('identities')).toEqual({})
  })
})

describe('executeMerge', () => {
  async function pendingMergeOfBIntoA() {
    const a = await resolveSignIn(github())
    const b = await resolveSignIn(google({ email: 'b@example.com' }))
    db.collectionData('memes').set('m1', { ownerId: b, uploadedBy: 'b@example.com' })
    db.collectionData('memes').set('m2', { ownerId: b, uploadedBy: 'b@example.com' })
    db.collectionData('memes').set('m3', { ownerId: a, uploadedBy: 'a@example.com' })
    db.collectionData('uploads').set('u1', { ownerId: b })
    const result = await linkIdentity(a, google({ email: 'b@example.com' }))
    const mergeId = (result as { mergeId: string }).mergeId
    const lookup = await getPendingMerge(mergeId, a)
    if (lookup.status !== 'ok') throw new Error(lookup.status)
    return { a, b, mergeId, merge: lookup.merge }
  }

  it('moves identities, memes and uploads, records the merge and removes the other account', async () => {
    const { a, b, mergeId, merge } = await pendingMergeOfBIntoA()
    expect(await executeMerge(mergeId, merge)).toEqual({ identities: 1, memes: 2 })

    expect((await listIdentities(a)).map((i) => i.id).sort()).toEqual(['github:gh1', 'google:go1'])
    expect(db.dump('memes').m1.ownerId).toBe(a)
    expect(db.dump('memes').m2.ownerId).toBe(a)
    expect(db.dump('uploads').u1.ownerId).toBe(a)
    expect(await accountExists(b)).toBe(false)
    expect(db.dump('pendingMerges')).toEqual({})
    expect(db.dump('merges')[mergeId]).toMatchObject({
      survivorId: a,
      removedId: b,
      identityIds: ['google:go1'],
      memeIds: ['m1', 'm2'],
    })
  })

  it('keeps the uploader email on moved memes', async () => {
    const { mergeId, merge } = await pendingMergeOfBIntoA()
    await executeMerge(mergeId, merge)
    expect(db.dump('memes').m1.uploadedBy).toBe('b@example.com')
  })

  it('finishes when confirmed again after failing partway, and still records everything moved', async () => {
    const { a, b, mergeId, merge } = await pendingMergeOfBIntoA()
    db.failOnCommit = db.commits + 2 // identities move, then the memes batch fails
    await expect(executeMerge(mergeId, merge)).rejects.toThrow('Injected commit failure')
    expect(await accountExists(b)).toBe(true)
    expect(db.dump('pendingMerges')[mergeId].movedIdentityIds).toEqual(['google:go1'])

    db.failOnCommit = undefined
    const retry = await getPendingMerge(mergeId, a, new Date(Date.now() + 60 * 60 * 1000))
    expect(retry.status).toBe('ok') // started merges may finish after the confirmation window
    await executeMerge(mergeId, (retry as { merge: Parameters<typeof executeMerge>[1] }).merge)

    expect(await accountExists(b)).toBe(false)
    expect(db.dump('merges')[mergeId]).toMatchObject({ identityIds: ['google:go1'], memeIds: ['m1', 'm2'] })
  })

  it('moves more memes than fit in one batch', async () => {
    const { a, mergeId, merge } = await pendingMergeOfBIntoA()
    for (let i = 0; i < 1100; i++) db.collectionData('memes').set(`bulk${i}`, { ownerId: merge.otherId })
    const result = await executeMerge(mergeId, merge)
    expect(result.memes).toBe(1102)
    expect(Object.values(db.dump('memes')).every((m) => m.ownerId === a)).toBe(true)
  })

  it('refuses a pending merge that expired before it started', async () => {
    const { a, mergeId } = await pendingMergeOfBIntoA()
    expect((await getPendingMerge(mergeId, a, new Date(Date.now() + 11 * 60 * 1000))).status).toBe('expired')
  })
})
