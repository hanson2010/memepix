import { describe, it, expect, jest, beforeEach } from '@jest/globals'

jest.mock('@/lib/firebase', () => ({
  memesCollection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    orderBy: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(() => ({ docs: [], empty: true })),
      })),
      get: jest.fn(() => ({ docs: [] })),
    })),
    where: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(() => ({ docs: [], empty: true })),
        })),
        get: jest.fn(() => ({ docs: [] })),
      })),
    })),
  })),
  categoriesCollection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn(),
    })),
    orderBy: jest.fn(() => ({
      get: jest.fn(() => ({ docs: [] })),
    })),
    where: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(() => ({ docs: [], empty: true })),
      })),
    })),
  })),
}))

describe('Meme Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
  })
})
