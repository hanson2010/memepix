/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import sharp from 'sharp'

vi.stubEnv('R2_PUBLIC_URL', 'https://pics.example.com')
vi.stubEnv('R2_BUCKET_NAME', 'test-bucket')

const { sent, failThumbnail } = vi.hoisted(() => ({
  sent: [] as { Key: string; ContentType: string; Body: Buffer }[],
  failThumbnail: { value: false },
}))

vi.mock('@/lib/r2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/r2')>()),
  getR2Client: () => ({
    send: async (command: { input: { Key: string; ContentType: string; Body: Buffer } }) => {
      if (failThumbnail.value && command.input.Key.startsWith('thumbs/')) throw new Error('R2 down')
      sent.push(command.input)
    },
  }),
}))
vi.mock('@/lib/session', () => ({ getAuthSession: async () => ({ user: { id: 'acct1' } }) }))

const { POST } = await import('@/app/api/upload-proxy/route')

async function upload(image?: Buffer) {
  image ??= await sharp({ create: { width: 1600, height: 900, channels: 3, background: '#48c' } }).jpeg().toBuffer()
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(image)], { type: 'image/jpeg' }), 'image.jpg')
  form.append('hash', '80def679ee5227d3')
  return POST(new NextRequest('http://localhost/api/upload-proxy', { method: 'POST', body: form }))
}

beforeEach(() => {
  sent.length = 0
  failThumbnail.value = false
})

describe('POST /api/upload-proxy', () => {
  it('stores the image and a 480px WebP thumbnail under thumbs/480 with the same date path and hash', async () => {
    const res = await upload()
    const body = await res.json()
    expect(res.status).toBe(200)

    const [image, thumb] = sent
    expect(image.Key).toMatch(/^\d{4}\/\d{2}\/80def679ee5227d3\.jpg$/)
    expect(thumb.Key).toBe(`thumbs/480/${image.Key.replace('.jpg', '.webp')}`)
    expect(thumb.ContentType).toBe('image/webp')
    const meta = await sharp(thumb.Body).metadata()
    expect([meta.format, meta.width, meta.height]).toEqual(['webp', 853, 480])

    expect(body.imageUrl).toBe(`https://pics.example.com/${image.Key}`)
    expect(body.thumbnailUrl).toBe(`https://pics.example.com/${thumb.Key}`)
  })

  it('still succeeds without a thumbnail when storing it fails', async () => {
    failThumbnail.value = true
    const res = await upload()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.imageUrl).toMatch(/80def679ee5227d3\.jpg$/)
    expect(body.thumbnailUrl).toBeNull()
  })

  it('keeps EXIF on the stored image, with the orientation reset to upright, and none on the thumbnail', async () => {
    // As the browser sends it: pixels already upright, original EXIF (here "rotate 90°") put back
    const image = await sharp({ create: { width: 1600, height: 900, channels: 3, background: '#48c' } })
      .jpeg()
      .withExif({ IFD0: { Make: 'TestCam', Model: 'X1', Orientation: '6' } })
      .toBuffer()
    await upload(image)
    const [stored, thumb] = sent

    const meta = await sharp(stored.Body).metadata()
    expect(meta.exif).toBeDefined()
    const exif = meta.exif!.toString('latin1')
    expect(exif).toContain('TestCam')
    expect(exif).toContain('X1')
    expect(meta.orientation).toBe(1)
    expect([meta.width, meta.height]).toEqual([1600, 900])

    expect((await sharp(thumb.Body).metadata()).exif).toBeUndefined()
  })
})
