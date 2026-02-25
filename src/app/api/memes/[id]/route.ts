import { NextRequest, NextResponse } from 'next/server'
import { getMeme, deleteMeme } from '@/lib/meme-service'
import { getAuthSession } from '@/lib/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const meme = await getMeme(id)

    if (!meme) {
      return NextResponse.json(
        { error: 'Meme not found' },
        { status: 404 }
      )
    }

    if (!meme.uploadedBy || meme.uploadedBy.toLowerCase() !== session.user?.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own memes' },
        { status: 403 }
      )
    }

    await deleteMeme(id, meme.imageUrl)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting meme:', error)
    return NextResponse.json(
      { error: 'Failed to delete meme' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const meme = await getMeme(id)

    if (!meme) {
      return NextResponse.json(
        { error: 'Meme not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(meme)
  } catch (error) {
    console.error('Error fetching meme:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meme' },
      { status: 500 }
    )
  }
}
