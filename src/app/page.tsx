'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { UploadForm } from '@/components/UploadForm'
import { ImagePreview } from '@/components/ImagePreview'
import { CategorySelect } from '@/components/CategorySelect'
import { TagInput } from '@/components/TagInput'
import { DescriptionInput } from '@/components/DescriptionInput'
import { MemeGallery } from '@/components/MemeGallery'
import { MemeDetail } from '@/components/MemeDetail'
import { CategoryFilter } from '@/components/CategoryFilter'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { AuthButton } from '@/components/AuthButton'
import type { Meme, UploadState } from '@/types'

function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export default function Home() {
  const { data: session } = useSession()
  const [view, setView] = useState<'browse' | 'upload'>('browse')
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'pending' })
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [locationTag, setLocationTag] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#upload' && session) {
        setView('upload')
      }
    }
    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [session])

  const handleUploadComplete = useCallback(async (imageUrl: string) => {
    setUploadState({ status: 'analyzing', imageUrl })

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })

      if (res.ok) {
        const data = await res.json()
        setDescription(data.description || '')
        
        if (data.locationHint) {
          const normalizedHint = normalizeTag(data.locationHint)
          setLocationTag(normalizedHint)
          setTags((t) => (t.includes(normalizedHint) ? t : [...t, normalizedHint]))
        }
        
        const defaultCategory = data.hasTranslation 
          ? 'machine-translation-fails' 
          : 'others'
        setCategory(defaultCategory)
        
        setUploadState({
          status: 'ready',
          imageUrl,
          aiSuggestion: {
            description: data.description,
            locationTag: data.locationHint,
            hasTranslation: data.hasTranslation,
          },
        })
      } else {
        setUploadState({ status: 'ready', imageUrl })
      }
    } catch {
      setUploadState({ status: 'ready', imageUrl })
    }
  }, [])

  const handleSave = async () => {
    if (!uploadState.imageUrl || !description || !category) return

    setSaving(true)
    try {
      const res = await fetch('/api/memes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadState.imageUrl,
          description,
          category,
          tags,
          locationTag,
        }),
      })

      if (res.ok) {
        setUploadState({ status: 'pending' })
        setDescription('')
        setCategory('')
        setTags([])
        setLocationTag(undefined)
        setView('browse')
        setRefreshKey((k) => k + 1)
      }
    } catch (error) {
      console.error('Failed to save meme:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setUploadState({ status: 'pending' })
    setDescription('')
    setCategory('')
    setTags([])
    setLocationTag(undefined)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header activeTab={view === 'upload' && session ? 'upload' : 'browse'} />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        {view === 'browse' ? (
          <div className="space-y-4 sm:space-y-6">
            <CategoryFilter value={filterCategory} onChange={setFilterCategory} />
            <MemeGallery
              key={refreshKey}
              category={filterCategory || undefined}
              onSelect={setSelectedMeme}
            />
          </div>
        ) : !session ? (
          <div className="max-w-2xl mx-auto text-center py-8 sm:py-12">
            <p className="text-gray-600 mb-4">Please sign in to upload and share pictures.</p>
            <AuthButton />
          </div>
        ) : (
          <div id="upload" className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            {!uploadState.imageUrl ? (
              <UploadForm onUploadComplete={handleUploadComplete} />
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <ImagePreview
                  src={uploadState.imageUrl}
                  onRemove={handleReset}
                />

                {uploadState.status === 'analyzing' && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-3" />
                    <span className="text-gray-600">Analyzing image...</span>
                  </div>
                )}

                {uploadState.status === 'ready' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <DescriptionInput
                        value={description}
                        onChange={setDescription}
                        suggestion={uploadState.aiSuggestion?.description}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <CategorySelect value={category} onChange={setCategory} />
                    </div>



                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                      </label>
                      <TagInput value={tags} onChange={setTags} />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                      <button
                        onClick={handleSave}
                        disabled={saving || !description || !category}
                        className="flex-1 px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                      >
                        {saving ? 'Saving...' : 'Save Meme'}
                      </button>
                      <button
                        onClick={handleReset}
                        className="px-4 py-3 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors min-h-[44px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {selectedMeme && (
        <MemeDetail 
          meme={selectedMeme} 
          onClose={() => setSelectedMeme(null)} 
          currentUserEmail={session?.user?.email ?? undefined}
          onDeleted={() => setRefreshKey((k) => k + 1)}
          onUpdated={(meme) => setSelectedMeme(meme)}
        />
      )}

      <Footer />
    </div>
  )
}
