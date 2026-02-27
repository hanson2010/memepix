import Link from 'next/link'
import { tagsCollection } from '@/lib/firebase'
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

const TAG_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', hoverBg: 'hover:bg-blue-200', hoverText: 'hover:text-blue-900' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', hoverBg: 'hover:bg-cyan-200', hoverText: 'hover:text-cyan-900' },
  { bg: 'bg-teal-100', text: 'text-teal-800', hoverBg: 'hover:bg-teal-200', hoverText: 'hover:text-teal-900' },
  { bg: 'bg-green-100', text: 'text-green-800', hoverBg: 'hover:bg-green-200', hoverText: 'hover:text-green-900' },
  { bg: 'bg-yellow-100', text: 'text-yellow-800', hoverBg: 'hover:bg-yellow-200', hoverText: 'hover:text-yellow-900' },
  { bg: 'bg-amber-100', text: 'text-amber-800', hoverBg: 'hover:bg-amber-200', hoverText: 'hover:text-amber-900' },
  { bg: 'bg-orange-100', text: 'text-orange-800', hoverBg: 'hover:bg-orange-200', hoverText: 'hover:text-orange-900' },
  { bg: 'bg-red-100', text: 'text-red-800', hoverBg: 'hover:bg-red-200', hoverText: 'hover:text-red-900' },
]

function getTagColor(count: number, minCount: number, maxCount: number): typeof TAG_COLORS[0] {
  if (maxCount === minCount) return TAG_COLORS[4]
  const ratio = (count - minCount) / (maxCount - minCount)
  const index = Math.round(ratio * (TAG_COLORS.length - 1))
  return TAG_COLORS[index]
}

async function getTags(): Promise<TagCount[]> {
  const snapshot = await tagsCollection()
    .orderBy('__name__')
    .get()

  const tags = snapshot.docs
    .map((doc) => ({
      name: doc.id,
      count: doc.data().count || 0,
    }))
    .filter((tag) => tag.count > 0)
    .slice(0, 50)

  return tags
}

export default async function TagsPage() {
  const tags = await getTags()

  const counts = tags.map((t) => t.count)
  const minCount = Math.min(...counts)
  const maxCount = Math.max(...counts)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header activeTab="tags" />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {tags.length === 0 ? (
          <p className="text-gray-600">No tags yet. Upload some memes with tags to see them here!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const color = getTagColor(tag.count, minCount, maxCount)
              return (
                <Link
                  key={tag.name}
                  href={`/tags/${encodeURIComponent(tag.name)}`}
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm ${color.bg} ${color.text} ${color.hoverBg} ${color.hoverText} transition-colors`}
                >
                  <span className="mr-2">{tag.name}</span>
                  <span className={`text-xs ${color.bg.replace('bg-', 'bg-opacity-50 ')} px-2 py-1 rounded-full`}>{tag.count}</span>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
