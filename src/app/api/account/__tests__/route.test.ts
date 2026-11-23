/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FakeFirestore } from '@/test/fake-firestore'

let db: FakeFirestore
const session = vi.hoisted(() => ({ value: null as { user: { id: string } } | null }))

vi.mock('@/lib/firebase', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/firebase')>()),
  getDb: () => db,
}))
vi.mock('@/lib/session', () => ({ getAuthSession: async () => session.value }))

const { GET } = await import('@/app/api/account/route')

beforeEach(() => {
  db = new FakeFirestore()
  session.value = { user: { id: 'A' } }
})

describe('GET /api/account', () => {
  it('lists Google identities, then GitHub, each alphabetically by email or name', async () => {
    const identities = db.collectionData('identities')
    identities.set('github:1', { accountId: 'A', provider: 'github', email: 'zed@example.com', name: 'z' })
    identities.set('github:2', { accountId: 'A', provider: 'github', email: null, name: 'Bob' })
    identities.set('google:1', { accountId: 'A', provider: 'google', email: 'mia@example.com', name: 'm' })
    identities.set('github:3', { accountId: 'A', provider: 'github', email: 'Amy@example.com', name: 'a' })
    identities.set('google:2', { accountId: 'A', provider: 'google', email: 'ann@example.com', name: 'a' })
    identities.set('google:9', { accountId: 'B', provider: 'google', email: 'other@example.com', name: 'o' })

    const body = await (await GET()).json()
    expect(body.identities.map((i: { id: string }) => i.id)).toEqual([
      'google:2', // ann@
      'google:1', // mia@
      'github:3', // Amy@ (case does not matter)
      'github:2', // Bob (no email: name)
      'github:1', // zed@
    ])
  })

  it('refuses a signed-out request', async () => {
    session.value = null
    expect((await GET()).status).toBe(401)
  })
})
