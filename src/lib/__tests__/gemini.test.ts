import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/secrets', () => ({
  secrets: { googleAiApiKey: 'test-api-key' },
}))

describe('Gemini Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getGeminiClient', () => {
    it('should return a Gemini client instance', async () => {
      const { getGeminiClient } = await import('@/lib/gemini')
      
      const client = getGeminiClient()
      
      expect(client).toBeDefined()
    })
  })
})
