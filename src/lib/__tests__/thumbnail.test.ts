/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { createThumbnail } from '@/lib/thumbnail'
import { thumbnailKey, keyFromPublicUrl } from '@/lib/r2'

function jpeg(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: '#c33' } }).jpeg().toBuffer()
}

describe('createThumbnail', () => {
  it('makes a WebP whose shorter side is 480, keeping a landscape shape', async () => {
    const meta = await sharp(await createThumbnail(await jpeg(1920, 1080))).metadata()
    expect(meta.format).toBe('webp')
    expect([meta.width, meta.height]).toEqual([853, 480])
  })

  it('keeps a portrait shape', async () => {
    const meta = await sharp(await createThumbnail(await jpeg(1080, 1920))).metadata()
    expect([meta.width, meta.height]).toEqual([480, 853])
  })

  it('never enlarges a small picture', async () => {
    const meta = await sharp(await createThumbnail(await jpeg(300, 200))).metadata()
    expect([meta.width, meta.height]).toEqual([300, 200])
  })

  it('drops metadata such as location', async () => {
    const withExif = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#333' } })
      .jpeg()
      .withExif({ IFD0: { Make: 'TestCam' } })
      .toBuffer()
    expect((await sharp(withExif).metadata()).exif).toBeDefined()
    expect((await sharp(await createThumbnail(withExif)).metadata()).exif).toBeUndefined()
  })
})

describe('thumbnail naming', () => {
  it('puts thumbnails under thumbs/480 with the same date path and hash', () => {
    expect(thumbnailKey('2026/03/80def679ee5227d3.jpg')).toBe('thumbs/480/2026/03/80def679ee5227d3.webp')
  })
})

describe('keyFromPublicUrl', () => {
  it('returns null for URLs outside the bucket', () => {
    expect(keyFromPublicUrl('https://evil.example.com/2026/03/x.jpg')).toBeNull()
  })
})
