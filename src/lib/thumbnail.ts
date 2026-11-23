import sharp from 'sharp'
import { THUMBNAIL_SIZE } from '@/lib/r2'

/**
 * Gallery thumbnail of an image: WebP, scaled so the shorter side is THUMBNAIL_SIZE
 * (never enlarged), keeping its shape. The gallery crops it to a square on screen.
 * Metadata is not copied, so thumbnails never carry location data.
 */
export async function createThumbnail(image: Buffer): Promise<Buffer> {
  return sharp(image)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'outside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
}
