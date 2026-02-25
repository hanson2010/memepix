export async function calculateHash(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const fullHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return fullHash.slice(0, 16)
}

export const calculateMD5Hash = calculateHash
