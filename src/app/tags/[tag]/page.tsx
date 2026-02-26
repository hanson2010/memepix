import { notFound } from 'next/navigation'
import { memesCollection } from '@/lib/firebase'
import { toMemeList } from '@/lib/firestore-utils'
import { TagPageClient } from './client-page'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ tag: string }>
}

export const metadata: Metadata = {
  title: 'Tag - MemePix',
}

async function getMemesByTag(tag: string) {
  const snapshot = await memesCollection()
    .where('tags', 'array-contains', tag)
    .get()

  const memes = toMemeList(snapshot)
  
  return memes.sort((a, b) => {
    const dateA = a.createdAt?.getTime() || 0
    const dateB = b.createdAt?.getTime() || 0
    return dateB - dateA
  })
}

async function getAllTags(): Promise<string[]> {
  const snapshot = await memesCollection().get()
  const memes = toMemeList(snapshot)

  const tagSet = new Set<string>()
  for (const meme of memes) {
    if (meme.tags) {
      for (const tag of meme.tags) {
        tagSet.add(tag)
      }
    }
  }

  return Array.from(tagSet).sort()
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)

  const allTags = await getAllTags()
  if (!allTags.includes(decodedTag)) {
    notFound()
  }

  const memes = await getMemesByTag(decodedTag)

  return <TagPageClient tag={decodedTag} memes={memes} />
}
