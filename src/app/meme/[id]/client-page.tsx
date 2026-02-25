'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { Meme } from '@/types'

interface MemeDetailPageProps {
  meme: Meme
}

const CATEGORY_NAMES: Record<string, string> = {
  'machine-translation-fails': 'Machine Translation Fails',
  'city-skyline': 'City Skyline',
  'natural-landscape': 'Natural Landscape',
  'life-style': 'Life Style',
  'others': 'Others',
}

export function MemeDetailPage({ meme }: MemeDetailPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meme?')) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/memes/${meme.id}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        router.push('/')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const categoryName = CATEGORY_NAMES[meme.category] || meme.category
  const canDelete = session?.user?.email && meme.uploadedBy && meme.uploadedBy.toLowerCase() === session.user.email.toLowerCase()

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 min-h-[44px]"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative aspect-video bg-gray-200">
            <div className="absolute inset-0 m-2 sm:m-3">
              <Image
                src={meme.imageUrl}
                alt={meme.description}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Description</h1>
              <p className="mt-1 sm:mt-2 text-gray-700">{meme.description}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-500">Category</h2>
              <p className="mt-1 text-gray-700">{categoryName}</p>
            </div>

            {meme.tags.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-500">Tags</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {meme.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize"
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

            <div className="pt-4 border-t space-y-3">
              <button
                onClick={handleCopy}
                className="w-full px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
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
              
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full px-4 py-3 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleting ? 'Deleting...' : 'Delete Meme'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
