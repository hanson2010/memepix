// One-off: creates gallery thumbnails for memes uploaded before thumbnails existed, and sets
// their thumbnailUrl. Skips memes that already have one, so it is safe to run more than once.
// New uploads get thumbnails from /api/upload-proxy (same settings as src/lib/thumbnail.ts).
//
// Usage (with the settings and R2 secret from .env.local, behind a proxy add NODE_USE_ENV_PROXY=1):
//   node scripts/create-thumbnails.mjs --dry-run   # list what would be created
//   node scripts/create-thumbnails.mjs             # create

import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import https from 'node:https'

const THUMBNAIL_SIZE = 480
const dryRun = process.argv.includes('--dry-run')
const { GOOGLE_CLOUD_PROJECT, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env
const secretKey = R2_SECRET_ACCESS_KEY || (process.env.APP_SECRETS ? JSON.parse(process.env.APP_SECRETS).R2_SECRET_ACCESS_KEY : '')

initializeApp({ credential: applicationDefault(), projectId: GOOGLE_CLOUD_PROJECT })
const db = getFirestore()
const r2 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: secretKey },
  // The SDK's own agent ignores NODE_USE_ENV_PROXY; this one honours HTTPS_PROXY / NO_PROXY
  requestHandler: { httpsAgent: new https.Agent({ proxyEnv: process.env }) },
})

const memes = (await db.collection('memes').get()).docs.filter((doc) => !doc.data().thumbnailUrl)
let created = 0
for (const doc of memes) {
  const { imageUrl } = doc.data()
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith(`${R2_PUBLIC_URL}/`)) {
    console.log(`${doc.id}: skipped, image is not in the bucket (${imageUrl})`)
    continue
  }
  const key = imageUrl.slice(R2_PUBLIC_URL.length + 1)
  const thumbKey = `thumbs/${THUMBNAIL_SIZE}/${key.replace(/\.[^./]+$/, '')}.webp`
  if (dryRun) {
    console.log(`${doc.id}: ${key} -> ${thumbKey}`)
    continue
  }

  const original = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }))
  const thumbnail = await sharp(Buffer.from(await original.Body.transformToByteArray()))
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'outside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: thumbKey,
    Body: thumbnail,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000',
  }))
  await doc.ref.update({ thumbnailUrl: `${R2_PUBLIC_URL}/${thumbKey}` })
  created++
  console.log(`${doc.id}: ${thumbKey} (${Math.round(thumbnail.length / 1024)}KB)`)
}
console.log(`${memes.length} memes without a thumbnail, ${dryRun ? 'none created (dry run)' : `${created} created`}`)
process.exit(0)
