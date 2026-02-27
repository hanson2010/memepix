'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { MemeGallery } from '@/components/MemeGallery'
import { MemeDetail } from '@/components/MemeDetail'
import { CategoryFilter } from '@/components/CategoryFilter'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import type { Meme } from '@/types'

export default function Home() {
  const { data: session } = useSession()
  const [filterCategory, setFilterCategory] = useState('')
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header activeTab="browse" />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          <CategoryFilter value={filterCategory} onChange={setFilterCategory} />
          <MemeGallery
            key={refreshKey}
            category={filterCategory || undefined}
            onSelect={setSelectedMeme}
          />
        </div>
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
