import '@testing-library/jest-dom/jest-globals'
import { webcrypto } from 'crypto'

const cryptoWithSubtle = {
  ...webcrypto,
  subtle: webcrypto.subtle,
}

Object.defineProperty(global, 'crypto', {
  value: cryptoWithSubtle,
})

class MockBlob {
  private parts: BlobPart[]
  private type: string

  constructor(parts: BlobPart[] = [], options: BlobPropertyBag = {}) {
    this.parts = parts
    this.type = options.type || ''
  }

  get size(): number {
    return this.parts.reduce((acc: number, part) => {
      if (typeof part === 'string') return acc + part.length
      if (part instanceof ArrayBuffer) return acc + part.byteLength
      if (part instanceof Blob) return acc + part.size
      return acc
    }, 0)
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const buffer = new ArrayBuffer(this.size)
    const view = new Uint8Array(buffer)
    let offset = 0
    for (const part of this.parts) {
      if (typeof part === 'string') {
        for (let i = 0; i < part.length; i++) {
          view[offset++] = part.charCodeAt(i)
        }
      } else if (part instanceof ArrayBuffer) {
        view.set(new Uint8Array(part), offset)
        offset += part.byteLength
      }
    }
    return buffer
  }

  async text(): Promise<string> {
    return this.parts.map(p => String(p)).join('')
  }
}

global.Blob = MockBlob as unknown as typeof Blob

export {}
