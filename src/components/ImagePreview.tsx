'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ImagePreviewProps {
  src: string
  alt?: string
  onRemove?: () => void
}

export function ImagePreview({ src, alt = 'Preview', onRemove }: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        )}
        
        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center text-red-500">
            <p>Failed to load image</p>
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            className={`object-contain transition-opacity duration-200 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
          />
        )}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          aria-label="Remove image"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
