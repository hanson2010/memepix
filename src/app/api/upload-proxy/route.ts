import { PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import { getR2Client, imageKey, publicUrl, R2_BUCKET_NAME, thumbnailKey } from '@/lib/r2'
import { createThumbnail } from '@/lib/thumbnail'
import { getAuthSession } from '@/lib/session'
import sharp from 'sharp'

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

    const key = imageKey(hash)

    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    const MAX_DIMENSION = 1920

    const metadata = await sharp(inputBuffer).metadata()
    const needsResizing = metadata.width && metadata.height && (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION)

    // Keep EXIF (camera, date, location) on the stored image. The browser already turned the
    // pixels upright when it redrew the picture, so the orientation tag is reset to upright;
    // keeping the original tag would make viewers rotate the picture a second time.
    let image = sharp(inputBuffer)
    if (needsResizing) {
      image = image.resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }
    const processedBuffer = await image.withMetadata({ orientation: 1 }).jpeg({ quality: 85 }).toBuffer()

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: processedBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000',
    })

    await getR2Client().send(command)
    const imageUrl = publicUrl(key)

    // Made from the stored image so it matches it exactly; without one the gallery shows the original
    let thumbnailUrl: string | null = null
    try {
      const thumbKey = thumbnailKey(key)
      await getR2Client().send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: thumbKey,
        Body: await createThumbnail(processedBuffer),
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000',
      }))
      thumbnailUrl = publicUrl(thumbKey)
    } catch (error) {
      console.error('Error creating thumbnail:', error)
    }

    return NextResponse.json({ imageUrl, thumbnailUrl, key })
  } catch (error) {
    console.error('Error uploading to R2:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
