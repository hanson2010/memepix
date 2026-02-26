'use client'

import { useState, useRef, useCallback } from 'react'
import type { UploadState } from '@/types'
import { normalizeImage } from '@/lib/image-utils'
import { calculateMD5Hash } from '@/lib/hash-utils'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface UploadFormProps {
  onUploadComplete: (imageUrl: string) => void
}

export function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [state, setState] = useState<UploadState>({ status: 'pending' })
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please select an image file (JPEG, PNG, GIF, or WebP)'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Image must be under 10MB'
    }
    return null
  }, [])

  const uploadFile = useCallback(async (file: File) => {
    const error = validateFile(file)
    if (error) {
      setState({ status: 'error', error })
      return
    }

    setState({ status: 'pending' })

    try {
      const normalized = await normalizeImage(file)
      const hash = await calculateMD5Hash(normalized.blob)

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash }),
      })

      if (!res.ok) {
        const data = await res.json()
        setState({ status: 'error', error: data.error || 'Upload failed' })
        return
      }

      const { uploadUrl, imageUrl } = await res.json()

      const arrayBuffer = await normalized.blob.arrayBuffer()
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: arrayBuffer,
        headers: { 
          'Content-Type': 'image/jpeg',
          'Content-Length': String(arrayBuffer.byteLength),
        },
      })

      if (!uploadRes.ok) {
        const formData = new FormData()
        formData.append('file', normalized.blob)
        formData.append('hash', hash)

        const proxyRes = await fetch('/api/upload-proxy', {
          method: 'POST',
          body: formData,
        })

        if (!proxyRes.ok) {
          const data = await proxyRes.json()
          setState({ status: 'error', error: data.error || 'Upload failed' })
          return
        }

        const { imageUrl: proxyImageUrl } = await proxyRes.json()
        setState({ status: 'ready', imageUrl: proxyImageUrl })
        onUploadComplete(proxyImageUrl)
        return
      }

      setState({ status: 'ready', imageUrl })
      onUploadComplete(imageUrl)
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }, [validateFile, onUploadComplete])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0])
    }
  }, [uploadFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0])
    }
  }, [uploadFile])

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors min-h-[160px] flex items-center justify-center ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleChange}
          className="hidden"
        />
        <div className="space-y-2">
          <div className="text-gray-600">
            <svg
              className="mx-auto h-10 w-10 sm:h-12 sm:w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-700 text-sm sm:text-base">
            Tap to select or drag and drop
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            JPEG, PNG, GIF, or WebP (max 10MB)
          </p>
        </div>
      </div>

      {state.status === 'error' && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}
    </div>
  )
}
