import Link from 'next/link'
import { memesCollection } from '@/lib/firebase'
import { toMemeList } from '@/lib/firestore-utils'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import type { Metadata } from 'next'

interface TagCount {
  name: string
  count: number
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tags - MemePix',
  description: 'Browse all tags and discover memes by topic',
}

async function getTags(): Promise<TagCount[]> {
  const snapshot = await memesCollection().get()
  const memes = toMemeList(snapshot)

  const tagMap = new Map<string, number>()
  for (const meme of memes) {
    if (meme.tags) {
      for (const tag of meme.tags) {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
      }
    }
  }

  const tags = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50)

  return tags
}

export default async function TagsPage() {
  const tags = await getTags()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header activeTab="tags" />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {tags.length === 0 ? (
          <p className="text-gray-600">No tags yet. Upload some memes with tags to see them here!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.name}
                href={`/tags/${encodeURIComponent(tag.name)}`}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                <span className="mr-2">{tag.name}</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{tag.count}</span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
