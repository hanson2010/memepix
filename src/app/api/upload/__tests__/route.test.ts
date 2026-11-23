/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.stubEnv('R2_ACCESS_KEY_ID', 'test-access-key')
vi.stubEnv('R2_BUCKET_NAME', 'test-bucket')
vi.stubEnv('R2_PUBLIC_URL', 'https://test.r2.dev')
vi.stubEnv('R2_ENDPOINT', 'https://test.r2.cloudflarestorage.com')

const { secrets, uploads, session } = vi.hoisted(() => ({
  secrets: { r2SecretAccessKey: 'test-secret-key', turnstileSecretKey: '' },
  uploads: [] as Record<string, unknown>[],
  session: { user: { id: 'acct1', email: 'test@example.com' } },
}))

vi.mock('@/lib/secrets', () => ({ secrets }))

// Counts the recorded uploads matching the query's == filters; the time window is not modelled
vi.mock('@/lib/firebase', () => ({
  uploadsCollection: () => {
    const filters: [string, unknown][] = []
    const query = {
      where: (field: string, op: string, value: unknown) => {
        if (op === '==') filters.push([field, value])
        return query
      },
      count: () => query,
      get: async () => ({
        data: () => ({ count: uploads.filter((u) => filters.every(([f, v]) => u[f] === v)).length }),
      }),
      add: async (doc: Record<string, unknown>) => {
        uploads.push(doc)
      },
    }
    return query
  },
}))

vi.mock('@/lib/session', () => ({
  getAuthSession: vi.fn(() => Promise.resolve(session)),
}))

describe('R2 Presigned URL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    uploads.length = 0
    secrets.turnstileSecretKey = ''
    session.user = { id: 'acct1', email: 'test@example.com' }
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

    it('records the account on each upload and counts uploads per account', async () => {
      const { POST } = await import('@/app/api/upload/route')
      secrets.turnstileSecretKey = 'turnstile-secret'
      const upload = (n: number) => POST(new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: JSON.stringify({ hash: n.toString(16).padStart(16, '0') }),
      }))

      // 6 uploads signed in with one identity, 4 with another identity of the same account
      session.user = { id: 'acct1', email: 'google@example.com' }
      for (let i = 0; i < 6; i++) expect((await upload(i)).status).toBe(200)
      session.user = { id: 'acct1', email: 'github@example.com' }
      for (let i = 6; i < 10; i++) expect((await upload(i)).status).toBe(200)

      expect(uploads.every((u) => u.ownerId === 'acct1')).toBe(true)
      const response = await upload(10)
      expect(response.status).toBe(403)
      expect((await response.json()).requiresCaptcha).toBe(true)

      // Another account is still below the limit
      session.user = { id: 'acct2', email: 'google@example.com' }
      expect((await upload(11)).status).toBe(200)
    })
  })
})
