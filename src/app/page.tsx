'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { UploadForm } from '@/components/UploadForm'
import { ImagePreview } from '@/components/ImagePreview'
import { CategorySelect } from '@/components/CategorySelect'
import { TagInput } from '@/components/TagInput'
import { DescriptionInput } from '@/components/DescriptionInput'
import { LocationTagSuggestion } from '@/components/LocationTagSuggestion'
import { MemeGallery } from '@/components/MemeGallery'
import { MemeDetail } from '@/components/MemeDetail'
import { CategoryFilter } from '@/components/CategoryFilter'
import { AuthButton } from '@/components/AuthButton'
import type { Meme, UploadState } from '@/types'

export default function Home() {
  const { data: session } = useSession()
  const [view, setView] = useState<'browse' | 'upload'>('browse')
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'pending' })
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [locationTag, setLocationTag] = useState<string | undefined>()
  const [locationSuggestion, setLocationSuggestion] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
        setLocationSuggestion(data.locationHint || undefined)
        
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
        setLocationSuggestion(undefined)
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
    setLocationSuggestion(undefined)
  }

  const handleNavClick = (newView: 'browse' | 'upload') => {
    setView(newView)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">MemePix</h1>
            
            <div className="hidden sm:flex items-center gap-4">
              <nav className="flex gap-2">
                <button
                  onClick={() => handleNavClick('browse')}
                  className={`px-4 py-2 rounded-lg transition-colors min-h-[44px] ${
                    view === 'browse'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Browse
                </button>
                <button
                  onClick={() => {
                    if (session) {
                      handleNavClick('upload')
                    }
                  }}
                  disabled={!session}
                  className={`px-4 py-2 rounded-lg transition-colors min-h-[44px] ${
                    view === 'upload'
                      ? 'bg-blue-600 text-white'
                      : session
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title={!session ? 'Sign in to upload' : ''}
                >
                  Upload
                </button>
              </nav>
              <AuthButton />
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="sm:hidden pt-3 pb-2 border-t mt-3 space-y-2">
              <button
                onClick={() => handleNavClick('browse')}
                className={`w-full px-4 py-3 rounded-lg transition-colors text-left min-h-[48px] ${
                  view === 'browse'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Browse
              </button>
              <button
                onClick={() => {
                  if (session) {
                    handleNavClick('upload')
                  }
                }}
                disabled={!session}
                className={`w-full px-4 py-3 rounded-lg transition-colors text-left min-h-[48px] ${
                  view === 'upload'
                    ? 'bg-blue-600 text-white'
                    : session
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Upload {!session && '(Sign in required)'}
              </button>
              <div className="pt-2">
                <AuthButton />
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
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
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
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

                    {locationSuggestion && !locationTag && (
                      <LocationTagSuggestion
                        suggestion={locationSuggestion}
                        onAccept={(tag) => {
                          setLocationTag(tag)
                          setTags((t) => (t.includes(tag) ? t : [...t, tag]))
                        }}
                        onReject={() => setLocationSuggestion(undefined)}
                      />
                    )}

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
        />
      )}
    </div>
  )
}
