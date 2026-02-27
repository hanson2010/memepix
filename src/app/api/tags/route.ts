import { NextRequest, NextResponse } from 'next/server'
import { tagsCollection } from '@/lib/firebase'

const MAX_TAGS = 500
const SEARCH_LIMIT = 20

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.toLowerCase()

  try {
    let tags: { name: string; count: number }[]

    if (query) {
      const snapshot = await tagsCollection()
        .where('count', '>', 0)
        .get()

      tags = snapshot.docs
        .map((doc) => ({
          name: doc.id,
          count: doc.data().count || 0,
        }))
        .filter((tag) => tag.name.toLowerCase().includes(query))
        .sort((a, b) => b.count - a.count)
        .slice(0, SEARCH_LIMIT)
    } else {
      const snapshot = await tagsCollection()
        .orderBy('count', 'desc')
        .limit(MAX_TAGS)
        .get()

      tags = snapshot.docs.map((doc) => ({
        name: doc.id,
        count: doc.data().count || 0,
      })).filter((tag) => tag.count > 0)
    }

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ tags: [] })
  }
}
