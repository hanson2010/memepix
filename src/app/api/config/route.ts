import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/env'
import { getAuthSession } from '@/lib/session'
import { uploadsCollection } from '@/lib/firebase'

const UPLOAD_LIMIT = 10
const TIME_WINDOW_MINUTES = 30

export async function GET() {
  const session = await getAuthSession()
  
  if (!session?.user?.email) {
    return NextResponse.json({ siteKey: '' })
  }

  const env = getEnv()
  if (!env.TURNSTILE_SITE_KEY) {
    return NextResponse.json({ siteKey: '' })
  }

  const cutoff = new Date(Date.now() - TIME_WINDOW_MINUTES * 60 * 1000)
  
  const snapshot = await uploadsCollection()
    .where('email', '==', session.user.email.toLowerCase())
    .where('timestamp', '>', cutoff)
    .count()
    .get()

  const count = snapshot.data().count
  const showCaptcha = count >= UPLOAD_LIMIT

  return NextResponse.json({
    siteKey: showCaptcha ? env.TURNSTILE_SITE_KEY : '',
  })
}
