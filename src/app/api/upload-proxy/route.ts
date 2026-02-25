import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
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

    const formData = await request.formData()
    const file = formData.get('file')
    const hash = formData.get('hash')

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Missing file' },
        { status: 400 }
      )
    }

    if (!hash || typeof hash !== 'string') {
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

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const client = getR2Client()
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    })

    await client.send(command)
    const imageUrl = `${env.R2_PUBLIC_URL}/${key}`

    return NextResponse.json({ imageUrl, key })
  } catch (error) {
    console.error('Error uploading to R2:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
