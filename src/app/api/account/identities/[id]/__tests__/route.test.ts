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

const { DELETE } = await import('@/app/api/account/identities/[id]/route')

function unlink(id: string) {
  return DELETE(new NextRequest(`http://localhost/api/account/identities/${encodeURIComponent(id)}`, { method: 'DELETE' }), {
    params: Promise.resolve({ id: encodeURIComponent(id) }),
  })
}

beforeEach(() => {
  db = new FakeFirestore()
  session.value = { user: { id: 'A' } }
  db.collectionData('identities').set('google:a', { accountId: 'A' })
  db.collectionData('identities').set('github:a', { accountId: 'A' })
  db.collectionData('identities').set('github:b', { accountId: 'B' })
  db.collectionData('memes').set('m1', { ownerId: 'A' })
})

describe('DELETE /api/account/identities/[id]', () => {
  it('unlinks one of two identities and keeps the account’s memes', async () => {
    expect((await unlink('github:a')).status).toBe(200)
    expect(Object.keys(db.dump('identities')).sort()).toEqual(['github:b', 'google:a'])
    expect(db.dump('memes').m1.ownerId).toBe('A')
  })

  it('refuses to unlink the last identity', async () => {
    await unlink('github:a')
    const res = await unlink('google:a')
    expect(res.status).toBe(409)
    expect(db.dump('identities')['google:a']).toBeDefined()
  })

  it('refuses another account’s identity', async () => {
    expect((await unlink('github:b')).status).toBe(404)
    expect(db.dump('identities')['github:b']).toBeDefined()
  })

  it('refuses a signed-out request', async () => {
    session.value = null
    expect((await unlink('github:a')).status).toBe(401)
    expect(Object.keys(db.dump('identities'))).toHaveLength(3)
  })
})
