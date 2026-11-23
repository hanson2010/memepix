import { describe, it, expect, vi } from 'vitest'

const { deleted, meme } = vi.hoisted(() => ({
  deleted: [] as string[],
  meme: {
    imageUrl: 'https://pics.example.com/2026/03/abc.jpg',
    thumbnailUrl: 'https://pics.example.com/thumbs/480/2026/03/abc.webp',
    tags: [],
  },
}))

vi.mock('@/lib/r2', () => ({
  R2_BUCKET_NAME: 'test-bucket',
  getR2Client: () => ({ send: async (command: { input: { Key: string } }) => void deleted.push(command.input.Key) }),
}))
vi.mock('@/lib/firebase', () => ({
  memesCollection: () => ({ doc: () => ({ get: async () => ({ exists: true, id: 'm1', data: () => meme }), delete: async () => {} }) }),
  tagsCollection: vi.fn(),
  categoriesCollection: vi.fn(),
  getDb: vi.fn(),
}))

const { deleteMeme } = await import('@/lib/meme-service')

describe('deleteMeme', () => {
  it('deletes the image and its thumbnail from R2', async () => {
    await deleteMeme('m1', meme.imageUrl)
    expect(deleted).toEqual(['2026/03/abc.jpg', 'thumbs/480/2026/03/abc.webp'])
  })
})
