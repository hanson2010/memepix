import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/env'
import { getAuthSession } from '@/lib/session'

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

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { hash } = await request.json()
    
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
    
    return NextResponse.json({
      uploadUrl,
      imageUrl,
      key,
    })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
