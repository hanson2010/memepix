import { NextRequest, NextResponse } from 'next/server'
import { createMeme, listMemes } from '@/lib/meme-service'
import { getAuthSession } from '@/lib/session'
import type { MemeInput } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const tagsParam = searchParams.get('tags')
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined
    const limit = parseInt(searchParams.get('limit') || '12', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const memes = await listMemes({ category, tags, limit, offset })
    return NextResponse.json(memes)
  } catch (error) {
    console.error('Error fetching memes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    const { imageUrl, description, category, tags, locationTag } = body
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing imageUrl' },
        { status: 400 }
      )
    }
    
    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }
    
    const input: MemeInput = {
      imageUrl,
      description: description.trim(),
      category,
      tags: tags || [],
      locationTag: locationTag?.toLowerCase().trim() || undefined,
    }
    
    const meme = await createMeme(input)
    
    return NextResponse.json(meme, { status: 201 })
  } catch (error) {
    console.error('Error creating meme:', error)
    return NextResponse.json(
      { error: 'Failed to create meme' },
      { status: 500 }
    )
  }
}
