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
  const hasInitialMemes = initialMemes.length > 0

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
    if (hasInitialMemes) {
      setMemes(initialMemes)
      setHasMore(initialMemes.length >= PAGE_SIZE)
      setPage(0)
      return
    }

    async function loadInitialMemes() {
      setLoading(true)
      setHasMore(true)
      try {
        const newMemes = await fetchMemes(0)
        setMemes(newMemes)
        if (newMemes.length < PAGE_SIZE) {
          setHasMore(false)
        }
        setPage(0)
      } catch (error) {
        console.error('Failed to load memes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialMemes()
  }, [category, tags, fetchMemes, hasInitialMemes, initialMemes])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || hasInitialMemes) return

    setLoading(true)
    try {
      const nextPage = page + 1
      const newMemes = await fetchMemes(nextPage * PAGE_SIZE)
      setMemes((prev) => [...prev, ...newMemes])
      if (newMemes.length < PAGE_SIZE) {
        setHasMore(false)
      }
      setPage(nextPage)
    } catch (error) {
      console.error('Failed to load more memes:', error)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, fetchMemes, hasInitialMemes])

  if (memes.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No memes found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {memes.map((meme) => (
          <button
            key={meme.id}
            onClick={() => onSelect?.(meme)}
            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100"
          >
            <Image
              src={meme.imageUrl}
              alt={meme.description}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

      {hasMore && !hasInitialMemes && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 min-h-[44px]"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
