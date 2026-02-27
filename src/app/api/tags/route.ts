import { NextResponse } from 'next/server'
import { tagsCollection } from '@/lib/firebase'

export async function GET() {
  try {
    const snapshot = await tagsCollection()
      .orderBy('count', 'desc')
      .get()

    const tags = snapshot.docs.map((doc) => ({
      name: doc.id,
      count: doc.data().count || 0,
    })).filter((tag) => tag.count > 0)

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ tags: [] })
  }
}
