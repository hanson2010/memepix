import { S3Client } from '@aws-sdk/client-s3'
import { secrets } from '@/lib/secrets'

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'meme-pictures'
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

let client: S3Client | null = null

export function getR2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: secrets.r2SecretAccessKey,
      },
    })
  }
  return client
}

/** Object key for an uploaded image: YYYY/MM/<hash>.jpg */
export function imageKey(hash: string, now = new Date()): string {
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${hash}.jpg`
}

/** Shorter side of gallery thumbnails, in pixels; part of the key so a new size never reuses cached files */
export const THUMBNAIL_SIZE = 480

/** Thumbnail key for an image key: YYYY/MM/<hash>.jpg -> thumbs/480/YYYY/MM/<hash>.webp */
export function thumbnailKey(key: string): string {
  return `thumbs/${THUMBNAIL_SIZE}/${key.replace(/\.[^./]+$/, '')}.webp`
}

export function publicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`
}

/** The R2 object key of a public URL in this bucket, or null for any other URL */
export function keyFromPublicUrl(url: string): string | null {
  if (!R2_PUBLIC_URL || !url.startsWith(`${R2_PUBLIC_URL}/`)) return null
  return url.slice(R2_PUBLIC_URL.length + 1) || null
}
