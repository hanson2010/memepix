'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { Meme } from '@/types'

interface MemeGalleryProps {
  initialMemes?: Meme[]
  category?: string
  tags?: string[]
  onSelect?: (meme: Meme) => void
}

const EMPTY_MEMES: Meme[] = []

export function MemeGallery({ initialMemes = EMPTY_MEMES, category, tags, onSelect }: MemeGalleryProps) {
  const [memes, setMemes] = useState<Meme[]>(initialMemes)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 12

  const fetchMemes = useCallback(async (offset: number) => {
    const params = new URLSearchParams()
    params.set('limit', String(PAGE_SIZE))
    params.set('offset', String(offset))
    if (category) params.set('category', category)
    if (tags && tags.length > 0) params.set('tags', tags.join(','))

    const res = await fetch(`/api/memes?${params}`)
    if (!res.ok) throw new Error('Failed to fetch memes')
    return res.json()
  }, [category, tags])

  useEffect(() => {
    setMemes(initialMemes)
    setPage(0)
    setHasMore(true)
  }, [category, tags, initialMemes])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const newMemes = await fetchMemes((page + 1) * PAGE_SIZE)
      if (newMemes.length < PAGE_SIZE) {
        setHasMore(false)
      }
      setMemes((prev) => [...prev, ...newMemes])
      setPage((p) => p + 1)
    } catch (error) {
      console.error('Failed to load more memes:', error)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, fetchMemes])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {memes.map((meme) => (
          <div
            key={meme.id}
            onClick={() => onSelect?.(meme)}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          >
            <Image
              src={meme.imageUrl}
              alt={meme.description}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More
          </button>
        </div>
      )}

      {!hasMore && memes.length > 0 && (
        <p className="text-center text-gray-500 py-4">
          No more memes to load
        </p>
      )}

      {!loading && memes.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No memes found. Upload some!
        </p>
      )}
    </div>
  )
}
