'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Meme } from '@/types'
import { CategorySelect } from '@/components/CategorySelect'
import { TagInput } from '@/components/TagInput'

interface MemeDetailProps {
  meme: Meme
  onClose: () => void
  currentUserEmail?: string
  onDeleted?: () => void
  onUpdated?: (meme: Meme) => void
}

const CATEGORY_NAMES: Record<string, string> = {
  'machine-translation-fails': 'Machine Translation Fails',
  'natural-landscape': 'Natural Landscape',
  'city-skyline': 'City Skyline',
  'life-style': 'Life Style',
  'others': 'Others',
}

export function MemeDetail({ meme: initialMeme, onClose, currentUserEmail, onDeleted, onUpdated }: MemeDetailProps) {
  const [meme, setMeme] = useState(initialMeme)
  const [isEditing, setIsEditing] = useState(false)
  const [editDescription, setEditDescription] = useState(meme.description)
  const [editCategory, setEditCategory] = useState(meme.category)
  const [editTags, setEditTags] = useState<string[]>(meme.tags)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
        onUpdated?.(updated)
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
        onDeleted?.()
        onClose()
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
  const canEdit = currentUserEmail && meme.uploadedBy && meme.uploadedBy.toLowerCase() === currentUserEmail.toLowerCase()

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative bg-white w-full sm:max-w-4xl sm:w-full sm:rounded-lg min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <Link
            href={`/meme/${meme.id}`}
            className="bg-white/80 rounded-full p-2 hover:bg-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open in new page"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
          <button
            onClick={onClose}
            className="bg-white/80 rounded-full p-2 hover:bg-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-full">
          <div className="relative aspect-video md:w-[60%] md:min-h-[400px] bg-gray-200">
            <div className="absolute inset-0 m-2 sm:m-3">
              <Image
                src={meme.imageUrl}
                alt={meme.description}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </div>
          </div>

          <div className="md:w-[40%] p-4 sm:p-6 space-y-4 overflow-auto">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              ) : (
                <p className="mt-1 text-gray-700">{meme.description}</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Category</h3>
              {isEditing ? (
                <CategorySelect value={editCategory} onChange={setEditCategory} />
              ) : (
                <p className="mt-1 text-gray-700">{categoryName}</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Tags</h3>
              {isEditing ? (
                <TagInput value={editTags} onChange={setEditTags} />
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {meme.tags.length > 0 ? (
                    meme.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
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
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy</span>
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
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>{deleting ? 'Deleting...' : 'Delete'}</span>
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
  )
}
