import { describe, it, expect, vi } from 'vitest'
import { googleIdentity, githubIdentity } from '@/lib/oauth-profile'

describe('googleIdentity', () => {
  it('uses a verified email, lowercased', () => {
    const identity = googleIdentity({ sub: 'g1', email: 'A@Example.com', email_verified: true, name: 'A', picture: 'p' })
    expect(identity).toEqual({
      provider: 'google',
      providerAccountId: 'g1',
      email: 'a@example.com',
      emailVerified: true,
      name: 'A',
      image: 'p',
    })
  })

  it('marks an unverified email as not verified', () => {
    expect(googleIdentity({ sub: 'g1', email: 'a@example.com', email_verified: false }).emailVerified).toBe(false)
  })

  it('handles a missing email', () => {
    const identity = googleIdentity({ sub: 'g1', email_verified: true })
    expect(identity.email).toBeNull()
    expect(identity.emailVerified).toBe(false)
  })
})

describe('githubIdentity', () => {
  const profile = { id: 42, login: 'octo', email: 'public@example.com', name: null, avatar_url: 'a' }

  function emailsResponse(emails: unknown) {
    return vi.fn(async () => ({ ok: true, json: async () => emails }) as Response)
  }

  it('uses the verified primary address, not the public profile email', async () => {
    const fetchFn = emailsResponse([
      { email: 'public@example.com', primary: false, verified: true },
      { email: 'Primary@Example.com', primary: true, verified: true },
    ])
    const identity = await githubIdentity(profile, 'token', fetchFn)
    expect(identity).toEqual({
      provider: 'github',
      providerAccountId: '42',
      email: 'primary@example.com',
      emailVerified: true,
      name: 'octo',
      image: 'a',
    })
    expect(fetchFn).toHaveBeenCalledWith('https://api.github.com/user/emails', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token' }),
    }))
  })

  it('marks an unverified primary address as not verified', async () => {
    const identity = await githubIdentity(profile, 'token', emailsResponse([
      { email: 'primary@example.com', primary: true, verified: false },
    ]))
    expect(identity.email).toBe('primary@example.com')
    expect(identity.emailVerified).toBe(false)
  })

  it('falls back to the unverified profile email when the email list is unavailable', async () => {
    const fetchFn = vi.fn(async () => ({ ok: false, json: async () => [] }) as unknown as Response)
    const identity = await githubIdentity(profile, 'token', fetchFn)
    expect(identity.email).toBe('public@example.com')
    expect(identity.emailVerified).toBe(false)
  })

  it('handles no email at all', async () => {
    const identity = await githubIdentity({ id: 7 }, undefined, vi.fn())
    expect(identity.email).toBeNull()
    expect(identity.emailVerified).toBe(false)
    expect(identity.name).toBeNull()
  })
})
