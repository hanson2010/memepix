'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Meme } from '@/types'

interface MemeDetailProps {
  meme: Meme
  onClose: () => void
}

export function MemeDetail({ meme, onClose }: MemeDetailProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/meme/${meme.id}`
    : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 rounded-full p-2 hover:bg-white"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="md:flex">
          <div className="md:w-2/3 relative aspect-video md:aspect-auto md:min-h-[400px]">
            <Image
              src={meme.imageUrl}
              alt={meme.description}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 66vw"
            />
          </div>

          <div className="md:w-1/3 p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
              <p className="mt-1 text-gray-700">{meme.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Category</h3>
              <p className="mt-1 text-gray-700">{meme.category}</p>
            </div>

            {meme.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {meme.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {meme.locationTag && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1 text-gray-700">{meme.locationTag}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <button
                onClick={handleCopy}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Share Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
