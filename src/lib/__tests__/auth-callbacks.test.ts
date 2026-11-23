import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Account, Profile, Session } from 'next-auth'
import type { JWT } from '@auth/core/jwt'
import { FakeFirestore } from '@/test/fake-firestore'

let db: FakeFirestore

vi.mock('@/lib/firebase', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/firebase')>()),
  getDb: () => db,
}))

const { cookieJar, currentSession } = vi.hoisted(() => ({
  cookieJar: new Map<string, string>(),
  currentSession: { value: null as { user: { id: string } } | null },
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    delete: (name: string) => cookieJar.delete(name),
  }),
}))
vi.mock('@/lib/auth', () => ({ auth: async () => currentSession.value }))
vi.mock('@/lib/secrets', () => ({ secrets: { nextauthSecret: 'test-secret' } }))

const { callbacks } = await import('@/lib/auth-callbacks')
const { createLinkIntent, LINK_COOKIE } = await import('@/lib/link-intent')

const googleAccount = { provider: 'google', providerAccountId: 'go1', type: 'oidc' } as Account
const googleProfile = { sub: 'go1', email: 'a@example.com', email_verified: true, name: 'A', picture: 'p' } as Profile

// The callbacks only read the fields they use; the casts stand in for Auth.js's full parameter objects
const signIn = (account: Account | null, profile?: Profile) =>
  callbacks.signIn!({ account, profile, user: {} } as Parameters<NonNullable<typeof callbacks.signIn>>[0])
const jwt = (token: JWT, account?: Account) =>
  callbacks.jwt!({ token, account, user: {} } as Parameters<NonNullable<typeof callbacks.jwt>>[0])
const session = (token: JWT) =>
  callbacks.session!({ session: { user: {} }, token } as unknown as Parameters<NonNullable<typeof callbacks.session>>[0])

beforeEach(() => {
  db = new FakeFirestore()
  cookieJar.clear()
  currentSession.value = null
})

describe('auth callbacks', () => {
  it('signs in, puts the account ID in the token and exposes it on the session', async () => {
    expect(await signIn(googleAccount, googleProfile)).toBe(true)
    const [accountId] = Object.keys(db.dump('users'))

    const token = await jwt({}, googleAccount)
    expect(token?.accountId).toBe(accountId)

    const result = (await session(token!)) as Session
    expect(result.user.id).toBe(accountId)
  })

  it('keeps the session on later requests while the account exists', async () => {
    await signIn(googleAccount, googleProfile)
    const token = await jwt({}, googleAccount)
    expect(await jwt(token!)).toEqual(token)
  })

  it('ends the session once the account no longer exists', async () => {
    await signIn(googleAccount, googleProfile)
    const token = await jwt({}, googleAccount)
    db.collectionData('users').clear()
    expect(await jwt(token!)).toBeNull()
  })

  it('refuses a sign-in without provider details or from an unknown provider', async () => {
    expect(await signIn(null)).toBe(false)
    expect(await signIn({ ...googleAccount, provider: 'twitter' }, googleProfile)).toBe(false)
    expect(Object.keys(db.dump('users'))).toHaveLength(0)
  })

  it('reads the GitHub verified email from the email list', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [{ email: 'gh@example.com', primary: true, verified: true }],
    }))
    vi.stubGlobal('fetch', fetchMock)
    const githubAccount = { provider: 'github', providerAccountId: '9', type: 'oauth', access_token: 't' } as Account
    await signIn(githubAccount, { id: 9, login: 'octo' } as unknown as Profile)
    vi.unstubAllGlobals()

    expect(db.dump('identities')['github:9']).toMatchObject({ email: 'gh@example.com', emailVerified: true })
  })
})

describe('auth callbacks: linking by hand', () => {
  const githubAccount = { provider: 'github', providerAccountId: '9', type: 'oauth', access_token: 't' } as Account
  const githubProfile = { id: 9, login: 'octo' } as unknown as Profile

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [{ email: 'gh@example.com', primary: true, verified: true }],
    })))
  })

  async function signedInGoogleAccount() {
    await signIn(googleAccount, googleProfile)
    const accountId = db.dump('identities')['google:go1'].accountId as string
    currentSession.value = { user: { id: accountId } }
    return accountId
  }

  it('links the identity, keeps the current session and clears the link cookie', async () => {
    const accountId = await signedInGoogleAccount()
    cookieJar.set(LINK_COOKIE, createLinkIntent(accountId))

    expect(await signIn(githubAccount, githubProfile)).toBe('/account?linked=github')
    expect(db.dump('identities')['github:9'].accountId).toBe(accountId)
    expect(cookieJar.has(LINK_COOKIE)).toBe(false)
  })

  it('reports an identity that is already linked', async () => {
    const accountId = await signedInGoogleAccount()
    cookieJar.set(LINK_COOKIE, createLinkIntent(accountId))
    expect(await signIn(googleAccount, googleProfile)).toBe('/account?already=google')
  })

  it('sends the user to confirm a merge when the identity has its own account', async () => {
    await signIn(githubAccount, githubProfile)
    const accountId = await signedInGoogleAccount()
    expect(Object.keys(db.dump('users'))).toHaveLength(2)
    cookieJar.set(LINK_COOKIE, createLinkIntent(accountId))

    const result = await signIn(githubAccount, githubProfile)
    const [mergeId] = Object.keys(db.dump('pendingMerges'))
    expect(result).toBe(`/account?merge=${mergeId}`)
  })

  it('ignores a leftover link cookie when the browser is no longer signed in to that account', async () => {
    const accountId = await signedInGoogleAccount()
    cookieJar.set(LINK_COOKIE, createLinkIntent(accountId))
    currentSession.value = null // cancelled the link, then signed out

    expect(await signIn(githubAccount, githubProfile)).toBe(true)
    expect(db.dump('identities')['github:9'].accountId).not.toBe(accountId)
    expect(cookieJar.has(LINK_COOKIE)).toBe(false)
  })

  it('ignores a forged link cookie', async () => {
    await signedInGoogleAccount()
    cookieJar.set(LINK_COOKIE, 'forged.value')
    expect(await signIn(githubAccount, githubProfile)).toBe(true)
  })
})
