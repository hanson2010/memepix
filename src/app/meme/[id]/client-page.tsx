'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Meme } from '@/types'

interface MemeDetailPageProps {
  meme: Meme
}

export function MemeDetailPage({ meme }: MemeDetailPageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative aspect-video">
            <Image
              src={meme.imageUrl}
              alt={meme.description}
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Description</h1>
              <p className="mt-2 text-gray-700">{meme.description}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-500">Category</h2>
              <p className="mt-1 text-gray-700">{meme.category}</p>
            </div>

            {meme.tags.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-500">Tags</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {meme.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {meme.locationTag && (
              <div>
                <h2 className="text-sm font-medium text-gray-500">Location</h2>
                <p className="mt-1 text-gray-700">{meme.locationTag}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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
