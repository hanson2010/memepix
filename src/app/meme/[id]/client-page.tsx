'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import type { Meme } from '@/types'
import { Header } from '@/components/Header'
import { CategorySelect } from '@/components/CategorySelect'
import { TagInput } from '@/components/TagInput'

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

export function MemeDetailPage({ meme: initialMeme }: MemeDetailPageProps) {
  const { data: session } = useSession()
  const [meme, setMeme] = useState(initialMeme)
  const [isEditing, setIsEditing] = useState(false)
  const [editDescription, setEditDescription] = useState(meme.description)
  const [editCategory, setEditCategory] = useState(meme.category)
  const [editTags, setEditTags] = useState<string[]>(meme.tags)
  const [saving, setSaving] = useState(false)
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

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/memes/${meme.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editDescription,
          category: editCategory,
          tags: editTags,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setMeme(updated)
        setIsEditing(false)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditDescription(meme.description)
    setEditCategory(meme.category)
    setEditTags(meme.tags)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meme?')) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/memes/${meme.id}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        window.location.href = '/'
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
  const canEdit = session?.user?.email && meme.uploadedBy && meme.uploadedBy.toLowerCase() === session.user.email.toLowerCase()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 min-h-[44px]"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Gallery
        </Link>
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
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              ) : (
                <p className="mt-1 sm:mt-2 text-gray-700">{meme.description}</p>
              )}
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-500">Category</h2>
              {isEditing ? (
                <CategorySelect value={editCategory} onChange={setEditCategory} />
              ) : (
                <p className="mt-1 text-gray-700">{categoryName}</p>
              )}
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-500">Tags</h2>
              {isEditing ? (
                <TagInput value={editTags} onChange={setEditTags} />
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {meme.tags.length > 0 ? (
                    meme.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400">No tags</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t flex flex-wrap gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    {copied ? (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Share Link
                      </>
                    )}
                  </button>

                  {canEdit && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 text-sm"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Meme
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {deleting ? 'Deleting...' : 'Delete Meme'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
