import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/secrets', () => ({ secrets: { nextauthSecret: 'test-secret' } }))

const { createLinkIntent, verifyLinkIntent, LINK_INTENT_SECONDS } = await import('@/lib/link-intent')

describe('link intent', () => {
  const now = 1_700_000_000_000

  it('round-trips the account ID while valid', () => {
    expect(verifyLinkIntent(createLinkIntent('acct1', now), now + 1000)).toBe('acct1')
  })

  it('expires after 10 minutes', () => {
    const value = createLinkIntent('acct1', now)
    expect(verifyLinkIntent(value, now + LINK_INTENT_SECONDS * 1000 - 1)).toBe('acct1')
    expect(verifyLinkIntent(value, now + LINK_INTENT_SECONDS * 1000)).toBeNull()
  })

  it('rejects a tampered account ID', () => {
    const [payload, signature] = createLinkIntent('acct1', now).split('.')
    const intent = JSON.parse(Buffer.from(payload, 'base64url').toString())
    const forged = Buffer.from(JSON.stringify({ ...intent, accountId: 'victim' })).toString('base64url')
    expect(verifyLinkIntent(`${forged}.${signature}`, now)).toBeNull()
  })

  it('rejects a bad signature and malformed values', () => {
    const [payload] = createLinkIntent('acct1', now).split('.')
    expect(verifyLinkIntent(`${payload}.AAAA`, now)).toBeNull()
    expect(verifyLinkIntent('garbage', now)).toBeNull()
    expect(verifyLinkIntent(undefined, now)).toBeNull()
  })

  it('gives each intent a different value', () => {
    expect(createLinkIntent('acct1', now)).not.toBe(createLinkIntent('acct1', now))
  })
})
