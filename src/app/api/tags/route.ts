import { NextResponse } from 'next/server'
import { memesCollection } from '@/lib/firebase'
import { toMemeList } from '@/lib/firestore-utils'

export async function GET() {
  try {
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

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ tags: [] })
  }
}
