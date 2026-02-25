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
    it('should reject invalid content types', async () => {
      const { POST } = await import('@/app/api/upload/route')
      
      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'test.pdf',
          contentType: 'application/pdf',
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid content type')
    })

    it('should reject missing parameters', async () => {
      const { POST } = await import('@/app/api/upload/route')
      
      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing')
    })
  })
})
