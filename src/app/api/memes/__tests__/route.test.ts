/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.stubEnv('R2_PUBLIC_URL', 'https://pics.example.com')

const { createMeme } = vi.hoisted(() => ({ createMeme: vi.fn(async (input: object) => ({ id: 'm1', ...input })) }))
vi.mock('@/lib/meme-service', () => ({ createMeme, listMemes: vi.fn() }))
vi.mock('@/lib/session', () => ({ getAuthSession: async () => ({ user: { id: 'acct1', email: 'ann@example.com' } }) }))

const { POST } = await import('@/app/api/memes/route')

function create(thumbnailUrl: unknown) {
  return POST(new NextRequest('http://localhost/api/memes', {
    method: 'POST',
    body: JSON.stringify({
      imageUrl: 'https://pics.example.com/2026/03/abc.jpg',
      thumbnailUrl,
      description: 'A meme',
      category: 'others',
      tags: [],
    }),
  }))
}

beforeEach(() => createMeme.mockClear())

describe('POST /api/memes thumbnailUrl', () => {
  it('stores a thumbnail from this bucket’s thumbs folder', async () => {
    expect((await create('https://pics.example.com/thumbs/480/2026/03/abc.webp')).status).toBe(201)
    expect(createMeme).toHaveBeenCalledWith(expect.objectContaining({
      thumbnailUrl: 'https://pics.example.com/thumbs/480/2026/03/abc.webp',
      ownerId: 'acct1',
    }))
  })

  it.each([
    ['another host', 'https://evil.example.com/thumbs/480/x.webp'],
    ['outside thumbs/', 'https://pics.example.com/2026/03/abc.jpg'],
    ['not a string', 42],
    ['missing', undefined],
  ])('drops a thumbnail URL that is %s', async (_, thumbnailUrl) => {
    expect((await create(thumbnailUrl)).status).toBe(201)
    expect(createMeme.mock.calls[0][0]).toMatchObject({ thumbnailUrl: undefined })
  })
})
