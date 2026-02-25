import { calculateHash, calculateMD5Hash } from '@/lib/hash-utils'

describe('calculateHash', () => {
  it('should calculate 16-char hash correctly', async () => {
    const content = 'Hello, World!'
    const blob = new Blob([content], { type: 'text/plain' })
    
    const hash = await calculateHash(blob)
    
    expect(hash).toMatch(/^[a-f0-9]{16}$/)
    expect(hash).toBe('dffd6021bb2bd5b0')
  })

  it('should return consistent hash for same content', async () => {
    const content = 'Test content'
    const blob1 = new Blob([content], { type: 'text/plain' })
    const blob2 = new Blob([content], { type: 'text/plain' })
    
    const hash1 = await calculateHash(blob1)
    const hash2 = await calculateHash(blob2)
    
    expect(hash1).toBe(hash2)
  })

  it('should return different hash for different content', async () => {
    const blob1 = new Blob(['content1'], { type: 'text/plain' })
    const blob2 = new Blob(['content2'], { type: 'text/plain' })
    
    const hash1 = await calculateHash(blob1)
    const hash2 = await calculateHash(blob2)
    
    expect(hash1).not.toBe(hash2)
  })

  it('should handle empty blob', async () => {
    const blob = new Blob([], { type: 'text/plain' })
    
    const hash = await calculateHash(blob)
    
    expect(hash).toMatch(/^[a-f0-9]{16}$/)
    expect(hash).toBe('e3b0c44298fc1c14')
  })

  it('calculateMD5Hash should be alias for calculateHash', async () => {
    const blob = new Blob(['test'], { type: 'text/plain' })
    
    const hash1 = await calculateHash(blob)
    const hash2 = await calculateMD5Hash(blob)
    
    expect(hash1).toBe(hash2)
  })
})
