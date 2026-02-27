import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/env'
import { getAuthSession } from '@/lib/session'
import { uploadsCollection } from '@/lib/firebase'
import { FieldValue } from 'firebase-admin/firestore'

async function verifyTurnstile(token: string): Promise<boolean> {
  const env = getEnv()
  if (!env.TURNSTILE_SECRET_KEY) {
    return true
  }

  const formData = new FormData()
  formData.append('response', token)
  formData.append('secret', env.TURNSTILE_SECRET_KEY)

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

function getR2Client(): S3Client {
  const env = getEnv()
  return new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  })
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

    const env = getEnv()
    const cutoff = new Date(Date.now() - TIME_WINDOW_MINUTES * 60 * 1000)
    const snapshot = await uploadsCollection()
      .where('email', '==', session.user?.email?.toLowerCase())
      .where('timestamp', '>', cutoff)
      .count()
      .get()

    const uploadCount = snapshot.data().count
    const requiresCaptcha = uploadCount >= UPLOAD_LIMIT

    if (requiresCaptcha && env.TURNSTILE_SECRET_KEY) {
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
      email: session.user?.email?.toLowerCase(),
      timestamp: FieldValue.serverTimestamp(),
      hash,
    })
    
    const now = new Date()
    const key = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${hash}.jpg`
    
    const client = getR2Client()
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000',
    })
    
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
    const imageUrl = `${env.R2_PUBLIC_URL}/${key}`
    
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
