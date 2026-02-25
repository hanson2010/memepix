const MAX_DIMENSION = 1920
const COMPRESS_THRESHOLD = 2 * 1024 * 1024

export interface NormalizedImage {
  blob: Blob
  width: number
  height: number
}

export async function normalizeImage(file: File): Promise<NormalizedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      
      let { width, height } = img
      
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }
      }
      
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      ctx.drawImage(img, 0, 0, width, height)
      
      const needsCompression = file.size > COMPRESS_THRESHOLD
      
      const tryCreateBlob = (quality: number): Promise<Blob | null> => {
        return new Promise((resolve) => {
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
        })
      }
      
      const createBlob = async (): Promise<Blob> => {
        if (!needsCompression) {
          return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Failed to create blob'))
            }, 'image/jpeg')
          })
        }
        
        let quality = 0.9
        let blob = await tryCreateBlob(quality)
        if (!blob) throw new Error('Failed to create blob')
        
        while (blob.size > COMPRESS_THRESHOLD && quality > 0.1) {
          quality -= 0.1
          blob = await tryCreateBlob(quality)
          if (!blob) throw new Error('Failed to create blob')
        }
        
        return blob
      }
      
      createBlob()
        .then((blob) => resolve({ blob, width, height }))
        .catch(reject)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}
