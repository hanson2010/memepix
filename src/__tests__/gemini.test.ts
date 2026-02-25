import { describe, it, expect, jest, beforeEach } from '@jest/globals'

jest.mock('@/lib/env', () => ({
  getEnv: jest.fn(() => ({
    GOOGLE_AI_API_KEY: 'test-api-key',
  })),
}))

describe('Gemini Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getGeminiClient', () => {
    it('should return a Gemini client instance', async () => {
      const { getGeminiClient } = await import('@/lib/gemini')
      
      const client = getGeminiClient()
      
      expect(client).toBeDefined()
    })
  })
})
