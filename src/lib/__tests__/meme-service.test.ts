import { describe, it, expect, vi, beforeEach } from 'vitest'

const memeSet = vi.hoisted(() => vi.fn())

vi.mock('@/lib/firebase', () => ({
  memesCollection: vi.fn(() => ({
    doc: vi.fn(() => ({
      set: memeSet,
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
    orderBy: vi.fn(() => ({
      limit: vi.fn(() => ({
        get: vi.fn(() => ({ docs: [], empty: true })),
      })),
      get: vi.fn(() => ({ docs: [] })),
    })),
    where: vi.fn(() => ({
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(() => ({ docs: [], empty: true })),
        })),
        get: vi.fn(() => ({ docs: [] })),
      })),
    })),
  })),
  tagsCollection: vi.fn(() => ({
    doc: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
    })),
  })),
  categoriesCollection: vi.fn(() => ({
    doc: vi.fn(() => ({
      set: vi.fn(),
      get: vi.fn(),
    })),
    orderBy: vi.fn(() => ({
      get: vi.fn(() => ({ docs: [] })),
    })),
    where: vi.fn(() => ({
      limit: vi.fn(() => ({
        get: vi.fn(() => ({ docs: [], empty: true })),
      })),
    })),
  })),
}))

describe('Meme Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createMeme', () => {
    it('should create a meme with required fields', async () => {
      const { createMeme } = await import('@/lib/meme-service')
      
      const input = {
        imageUrl: 'https://example.com/image.jpg',
        description: 'Test meme',
        category: 'funny',
        tags: ['test'],
      }
      
      const result = await createMeme(input)
      
      expect(result).toMatchObject({
        imageUrl: input.imageUrl,
        description: input.description,
        category: input.category,
        tags: input.tags,
      })
      expect(result.id).toBeDefined()
    })

    it('stores the owner account and the lowercased uploader email', async () => {
      const { createMeme } = await import('@/lib/meme-service')

      const result = await createMeme({
        imageUrl: 'https://example.com/image.jpg',
        description: 'Test meme',
        category: 'funny',
        tags: [],
        uploadedBy: 'Ann@Example.com',
        ownerId: 'acct1',
      })

      expect(memeSet).toHaveBeenCalledWith(expect.objectContaining({
        uploadedBy: 'ann@example.com',
        ownerId: 'acct1',
      }))
      expect(result).toMatchObject({ uploadedBy: 'ann@example.com', ownerId: 'acct1' })
    })
  })
})
