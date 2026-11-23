import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'
import { getR2Client, imageKey, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { secrets } from '@/lib/secrets'
import { getAuthSession } from '@/lib/session'
import { uploadsCollection } from '@/lib/firebase'
import { FieldValue } from 'firebase-admin/firestore'

async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = secrets.turnstileSecretKey
  if (!secretKey) {
    return true
  }

  const formData = new FormData()
  formData.append('response', token)
  formData.append('secret', secretKey)

  try {
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })
    const outcome = await result.json() as { success: boolean }
    return outcome.success
  } catch {
    return false
  }
}

const UPLOAD_LIMIT = 10
const TIME_WINDOW_MINUTES = 30

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { hash, turnstileToken } = await request.json()

    if (!hash) {
      return NextResponse.json(
        { error: 'Missing hash' },
        { status: 400 }
      )
    }
    
    if (!/^[a-f0-9]{16}$/.test(hash)) {
      return NextResponse.json(
        { error: 'Invalid hash format' },
        { status: 400 }
      )
    }

    const cutoff = new Date(Date.now() - TIME_WINDOW_MINUTES * 60 * 1000)
    const snapshot = await uploadsCollection()
      .where('ownerId', '==', session.user.id)
      .where('timestamp', '>', cutoff)
      .count()
      .get()

    const uploadCount = snapshot.data().count
    const requiresCaptcha = uploadCount >= UPLOAD_LIMIT

    if (requiresCaptcha && secrets.turnstileSecretKey) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: 'Captcha required', requiresCaptcha: true },
          { status: 403 }
        )
      }
      const isValid = await verifyTurnstile(turnstileToken)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Captcha verification failed' },
          { status: 403 }
        )
      }
    }

    await uploadsCollection().add({
      ownerId: session.user.id,
      // Kept so the previous version, which counts by email, still works after a rollback
      email: session.user?.email?.toLowerCase(),
      timestamp: FieldValue.serverTimestamp(),
      hash,
      // Deleted by Firestore's TTL policy once outside the rate-limit window
      expiresAt: new Date(Date.now() + TIME_WINDOW_MINUTES * 60 * 1000),
    })
    
    const key = imageKey(hash)

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000',
    })
    
    const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
    const imageUrl = `${R2_PUBLIC_URL}/${key}`
    
    const newCount = uploadCount + 1
    return NextResponse.json({
      uploadUrl,
      imageUrl,
      key,
      requiresCaptchaNext: newCount >= UPLOAD_LIMIT,
    })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
