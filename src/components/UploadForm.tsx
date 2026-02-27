'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { UploadState } from '@/types'
import { calculateMD5Hash } from '@/lib/hash-utils'
import { normalizeImage } from '@/lib/image-utils'
import { Turnstile } from '@/components/Turnstile'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface UploadFormProps {
  onUploadComplete: (imageUrl: string) => void
}

export function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [state, setState] = useState<UploadState>({ status: 'pending' })
  const [dragActive, setDragActive] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string>('')
  const [showCaptcha, setShowCaptcha] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.siteKey) {
          setTurnstileSiteKey(data.siteKey)
        }
      })
      .catch(() => {})
  }, [])

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please select an image file (JPEG, PNG, GIF, or WebP)'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Image must be under 10MB'
    }
    return null
  }, [])

  const uploadFile = useCallback(async (file: File, token?: string) => {
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
        body: JSON.stringify({ hash, turnstileToken: token }),
      })

      if (res.status === 401) {
        setState({ status: 'error', error: 'Please sign in to upload' })
        return
      }

      const data = await res.json()
      
      if (res.status === 403 && data.requiresCaptcha) {
        setShowCaptcha(true)
        setPendingFile(file)
        setState({ status: 'pending' })
        return
      }

      if (res.status === 403) {
        setState({ status: 'error', error: 'Captcha verification failed' })
        setTurnstileToken(null)
        return
      }

      if (!res.ok) {
        setState({ status: 'error', error: data.error || 'Upload failed' })
        return
      }

      if (data.requiresCaptchaNext) {
        fetch('/api/config')
          .then(r => r.json())
          .then(cfg => {
            if (cfg.siteKey) {
              setTurnstileSiteKey(cfg.siteKey)
            }
          })
          .catch(() => {})
      }

      const formData = new FormData()
      formData.append('file', normalized.blob, 'image.jpg')
      formData.append('hash', hash)

      const proxyRes = await fetch('/api/upload-proxy', {
        method: 'POST',
        body: formData,
      })

      if (!proxyRes.ok) {
        const proxyData = await proxyRes.json()
        setState({ status: 'error', error: proxyData.error || 'Upload failed' })
        return
      }

      const { imageUrl: proxyImageUrl } = await proxyRes.json()
      setState({ status: 'ready', imageUrl: proxyImageUrl })
      onUploadComplete(proxyImageUrl)
    } catch (err) {
      let errorMessage = 'Upload failed'
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = err.message
        }
      }
      setState({
        status: 'error',
        error: errorMessage,
      })
    }
  }, [validateFile, onUploadComplete])

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      setState({ status: 'error', error })
      return
    }

    if (turnstileSiteKey) {
      setPendingFile(file)
      setShowCaptcha(true)
    } else {
      uploadFile(file)
    }
  }, [validateFile, uploadFile, turnstileSiteKey])

  const handleCaptchaSuccess = useCallback((token: string) => {
    setTurnstileToken(token)
    setShowCaptcha(false)
    if (pendingFile) {
      uploadFile(pendingFile, token)
      setPendingFile(null)
    }
  }, [pendingFile, uploadFile])

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
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [handleFileSelect])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }, [handleFileSelect])

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

      {showCaptcha && turnstileSiteKey && (
        <div className="mt-4 flex justify-center">
          <Turnstile
            siteKey={turnstileSiteKey}
            onSuccess={handleCaptchaSuccess}
            onError={() => {
              setState({ status: 'error', error: 'Captcha failed. Please try again.' })
              setShowCaptcha(false)
            }}
          />
        </div>
      )}

      {state.status === 'error' && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}
    </div>
  )
}
