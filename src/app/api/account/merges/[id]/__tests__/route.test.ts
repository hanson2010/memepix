/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { FakeFirestore } from '@/test/fake-firestore'

let db: FakeFirestore
const session = vi.hoisted(() => ({ value: null as { user: { id: string } } | null }))

vi.mock('@/lib/firebase', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/firebase')>()),
  getDb: () => db,
}))
vi.mock('@/lib/session', () => ({ getAuthSession: async () => session.value }))

const { GET, POST, DELETE } = await import('@/app/api/account/merges/[id]/route')

const minutes = (n: number) => new Date(Date.now() + n * 60 * 1000)

type Handler = (request: NextRequest, context: { params: Promise<{ id: string }> }) => Promise<Response>

function call(handler: Handler, method: string) {
  return handler(new NextRequest('http://localhost/api/account/merges/pm1', { method }), {
    params: Promise.resolve({ id: 'pm1' }),
  })
}

beforeEach(() => {
  db = new FakeFirestore()
  session.value = { user: { id: 'A' } }
  db.collectionData('users').set('A', {})
  db.collectionData('users').set('B', {})
  db.collectionData('identities').set('google:b', { accountId: 'B', provider: 'google', email: 'b@example.com' })
  for (const id of ['m1', 'm2', 'm3']) db.collectionData('memes').set(id, { ownerId: 'B' })
  db.collectionData('pendingMerges').set('pm1', {
    survivorId: 'A', otherId: 'B', identityId: 'google:b', createdAt: new Date(), expiresAt: minutes(10),
  })
})

describe('/api/account/merges/[id]', () => {
  it('shows the other account’s identities and meme count to the surviving account', async () => {
    const res = await call(GET, 'GET')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      identities: [{ id: 'google:b', provider: 'google', email: 'b@example.com' }],
      memeCount: 3,
    })
  })

  it('refuses another account with 403 for every method', async () => {
    session.value = { user: { id: 'B' } }
    for (const [handler, method] of [[GET, 'GET'], [POST, 'POST'], [DELETE, 'DELETE']] as const) {
      expect((await call(handler, method)).status).toBe(403)
    }
    expect(db.dump('pendingMerges').pm1).toBeDefined()
    expect(db.dump('memes').m1.ownerId).toBe('B')
  })

  it('refuses an expired merge with 410 and moves nothing', async () => {
    db.collectionData('pendingMerges').get('pm1')!.expiresAt = minutes(-1)
    expect((await call(GET, 'GET')).status).toBe(410)
    expect((await call(POST, 'POST')).status).toBe(410)
    expect(db.dump('memes').m1.ownerId).toBe('B')
  })

  it('refuses signed-out requests with 401 and unknown merges with 404', async () => {
    session.value = null
    expect((await call(GET, 'GET')).status).toBe(401)
    session.value = { user: { id: 'A' } }
    db.collectionData('pendingMerges').clear()
    expect((await call(GET, 'GET')).status).toBe(404)
  })

  it('cancels, leaving both accounts as they were', async () => {
    expect((await call(DELETE, 'DELETE')).status).toBe(200)
    expect(db.dump('pendingMerges')).toEqual({})
    expect(Object.keys(db.dump('users')).sort()).toEqual(['A', 'B'])
    expect(db.dump('identities')['google:b'].accountId).toBe('B')
  })

  it('confirms, moving the other account into the signed-in one', async () => {
    const res = await call(POST, 'POST')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ identities: 1, memes: 3 })
    expect(Object.keys(db.dump('users'))).toEqual(['A'])
  })
})
