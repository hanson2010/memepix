/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { getAuthSession, getMeme, updateMeme, deleteMeme } = vi.hoisted(() => ({
  getAuthSession: vi.fn(),
  getMeme: vi.fn(),
  updateMeme: vi.fn(),
  deleteMeme: vi.fn(),
}))

vi.mock('@/lib/session', () => ({ getAuthSession }))
vi.mock('@/lib/meme-service', () => ({ getMeme, updateMeme, deleteMeme }))

const { PATCH, DELETE } = await import('@/app/api/memes/[id]/route')

const params = { params: Promise.resolve({ id: 'm1' }) }
const meme = { id: 'm1', imageUrl: 'https://x/1.jpg', uploadedBy: 'ann@example.com', ownerId: 'acct1' }

function patch() {
  return PATCH(new NextRequest('http://localhost/api/memes/m1', {
    method: 'PATCH',
    body: JSON.stringify({ description: 'New' }),
  }), params)
}

function del() {
  return DELETE(new NextRequest('http://localhost/api/memes/m1', { method: 'DELETE' }), params)
}

describe('/api/memes/[id] ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMeme.mockResolvedValue(meme)
    updateMeme.mockResolvedValue({ ...meme, description: 'New' })
  })

  it('lets the owning account edit and delete, whichever email it signed in with', async () => {
    getAuthSession.mockResolvedValue({ user: { id: 'acct1', email: 'other-identity@example.com' } })
    expect((await patch()).status).toBe(200)
    expect(updateMeme).toHaveBeenCalledWith('m1', { description: 'New' })
    expect((await del()).status).toBe(200)
    expect(deleteMeme).toHaveBeenCalledWith('m1', meme.imageUrl)
  })

  it('refuses another account with 403, even with the uploader email', async () => {
    getAuthSession.mockResolvedValue({ user: { id: 'acct2', email: 'ann@example.com' } })
    expect((await patch()).status).toBe(403)
    expect((await del()).status).toBe(403)
    expect(updateMeme).not.toHaveBeenCalled()
    expect(deleteMeme).not.toHaveBeenCalled()
  })

  it('refuses everyone for a meme no account has claimed yet', async () => {
    getMeme.mockResolvedValue({ ...meme, ownerId: undefined })
    getAuthSession.mockResolvedValue({ user: { id: 'acct1', email: 'ann@example.com' } })
    expect((await patch()).status).toBe(403)
    expect((await del()).status).toBe(403)
  })

  it('refuses a signed-out visitor with 401', async () => {
    getAuthSession.mockResolvedValue(null)
    expect((await patch()).status).toBe(401)
    expect((await del()).status).toBe(401)
    expect(getMeme).not.toHaveBeenCalled()
  })
})
