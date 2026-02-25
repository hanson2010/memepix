/**
 * @jest-environment node
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'

jest.mock('@/lib/env', () => ({
  getEnv: jest.fn(() => ({
    R2_ACCESS_KEY_ID: 'test-access-key',
    R2_SECRET_ACCESS_KEY: 'test-secret-key',
    R2_BUCKET_NAME: 'test-bucket',
    R2_PUBLIC_URL: 'https://test.r2.dev',
    R2_ENDPOINT: 'https://test.r2.cloudflarestorage.com',
  })),
}))

jest.mock('@/lib/session', () => ({
  getAuthSession: jest.fn(() => Promise.resolve({ user: { email: 'test@example.com' } })),
}))

describe('R2 Presigned URL', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/upload', () => {
    it('should reject invalid hash format', async () => {
      const { POST } = await import('@/app/api/upload/route')
      
      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: JSON.stringify({
          hash: 'invalid-hash',
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid hash format')
    })

    it('should reject missing hash', async () => {
      const { POST } = await import('@/app/api/upload/route')
      
      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing hash')
    })

    it('should generate presigned URL for valid hash', async () => {
      const { POST } = await import('@/app/api/upload/route')
      
      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: JSON.stringify({
          hash: 'a'.repeat(16),
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.uploadUrl).toBeDefined()
      expect(data.imageUrl).toContain('https://test.r2.dev')
      expect(data.key).toMatch(/^\d{4}\/\d{2}\/[a-f0-9]{16}\.jpg$/)
    })
  })
})
