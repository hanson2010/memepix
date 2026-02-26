import { normalizeImage } from '@/lib/image-utils'

describe('normalizeImage', () => {
  beforeEach(() => {
    global.Image = class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      src = ''
      width = 100
      height = 100
      
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    } as unknown as typeof Image

    const mockContext = {
      drawImage: jest.fn(),
    }

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => mockContext),
      toBlob: jest.fn((callback: (blob: Blob | null) => void) => {
        callback(new Blob(['mock-jpeg'], { type: 'image/jpeg' }))
      }),
      toDataURL: jest.fn(() => 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=='),
    }

    document.createElement = jest.fn(() => mockCanvas as unknown as HTMLCanvasElement)
    URL.createObjectURL = jest.fn(() => 'blob:mock-url')
    URL.revokeObjectURL = jest.fn()
  })

  it('should normalize image to JPEG format', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    const result = await normalizeImage(file)
    
    expect(result.blob.type).toBe('image/jpeg')
  })

  it('should resize large images', async () => {
    global.Image = class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      src = ''
      width = 3000
      height = 2000
      
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    } as unknown as typeof Image

    const file = new File(['test'], 'large.jpg', { type: 'image/jpeg' })
    
    const result = await normalizeImage(file)
    
    expect(result.width).toBeLessThanOrEqual(1920)
    expect(result.height).toBeLessThanOrEqual(1920)
  })

  it('should keep small images at original size', async () => {
    const file = new File(['test'], 'small.jpg', { type: 'image/jpeg' })
    
    const result = await normalizeImage(file)
    
    expect(result.width).toBe(100)
    expect(result.height).toBe(100)
  })
})
