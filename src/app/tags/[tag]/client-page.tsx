'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { MemeGallery } from '@/components/MemeGallery'
import { MemeDetail } from '@/components/MemeDetail'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import type { Meme } from '@/types'

interface TagPageClientProps {
  tag: string
  memes: Meme[]
}

export function TagPageClient({ tag, memes }: TagPageClientProps) {
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null)
  const { data: session } = useSession()
  const userEmail = session?.user?.email ?? undefined

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header activeTab="tags" />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/tags"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tags
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Memes tagged with &quot;{tag}&quot;
        </h1>

        {memes.length === 0 ? (
          <p className="text-gray-600">No memes found with this tag.</p>
        ) : (
          <MemeGallery initialMemes={memes} onSelect={(meme) => setSelectedMeme(meme)} />
        )}
      </main>

      {selectedMeme && (
        <MemeDetail
          meme={selectedMeme}
          onClose={() => setSelectedMeme(null)}
          currentUserEmail={userEmail}
          onDeleted={() => {}}
          onUpdated={(meme) => setSelectedMeme(meme)}
        />
      )}

      <Footer />
    </div>
  )
}
