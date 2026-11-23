import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/session'
import { createLinkIntent, LINK_COOKIE, LINK_INTENT_SECONDS } from '@/lib/link-intent'
import { PROVIDERS } from '@/lib/providers'
import type { Provider } from '@/types'

/** Starts linking: the client signs in with `provider` next, and the sign-in links to this account */
export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { provider } = await request.json().catch(() => ({}))
  if (!PROVIDERS.includes(provider as Provider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(LINK_COOKIE, createLinkIntent(session.user.id), {
    httpOnly: true,
    // Lax still sends the cookie on the provider's top-level redirect back to the callback
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: LINK_INTENT_SECONDS,
    path: '/',
  })
  return response
}
