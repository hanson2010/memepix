import { NextRequest, NextResponse } from 'next/server'
import { getVisionModel } from '@/lib/gemini'

const ANALYSIS_TIMEOUT = 30000

const ANALYSIS_PROMPT = `Analyze this image and return results in JSON format with the following fields:

1. "hasTranslation": boolean - Does the image contain Chinese-to-English translations that are improper, humorous, or have grammatical errors?

2. "description": string - If hasTranslation is true, describe the translation humor or error. Otherwise, provide a simple sentence to describe the image.

3. "categoryHint": string - If hasTranslation is false, categorize the image as one of: "natural-landscape" (mountains, beaches, parks, nature), "city-skyline" (buildings, urban scenes, city views), "life-style" (people, food, daily activities, shopping), "others" (anything that doesn't fit above).

4. "tagsHint": string - Provide up to 4 words or phrases (comma-separated) to describe the image in English. If location is detected from EXIF data or visual indicators (street signs, landmarks, currency, license plates, etc.), include the city or town name WITHOUT country name at the LAST position. For example: "japanese_signage, Akihabara" or "street_food, Bangkok".

Provide your analysis in JSON format:
{
  "hasTranslation": boolean,
  "description": "string",
  "categoryHint": "string",
  "tagsHint": "string"
}`

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing imageUrl' },
        { status: 400 }
      )
    }

    console.log('Analyzing image:', imageUrl)

    const model = getVisionModel()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT)

    let imageData
    try {
      imageData = await fetchImageAsBase64(imageUrl)
    } catch (fetchError) {
      console.error('Failed to fetch image for analysis:', fetchError)
      return NextResponse.json({
        hasTranslation: false,
        description: '',
        tagsHint: '',
      })
    }

    try {
      const result = await Promise.race([
        model.generateContent([
          { text: ANALYSIS_PROMPT },
          {
            inlineData: {
              mimeType: imageData.mimeType,
              data: imageData.data,
            },
          },
        ]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Analysis timeout')), ANALYSIS_TIMEOUT)
        ),
      ])

      clearTimeout(timeoutId)

      const response = (result as Awaited<ReturnType<typeof model.generateContent>>).response
      const text = response.text()

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({
          hasTranslation: false,
          description: '',
          tagsHint: '',
        })
      }

      const analysis = JSON.parse(jsonMatch[0])

      return NextResponse.json({
        hasTranslation: analysis.hasTranslation ?? false,
        description: analysis.description ?? '',
        tagsHint: analysis.tagsHint ?? '',
        categoryHint: analysis.categoryHint ?? 'others',
      })
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.message === 'Analysis timeout') {
        return NextResponse.json(
          { error: 'Analysis timed out. Please try again or enter details manually.' },
          { status: 408 }
        )
      }

      throw error
    }
  } catch (error) {
    console.error('Image analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze image. Please enter details manually.' },
      { status: 500 }
    )
  }
}

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MemePix/1.0',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()
    const data = Buffer.from(buffer).toString('base64')
    
    return { data, mimeType: contentType }
  } catch (error) {
    console.error('Error fetching image:', url, error)
    throw error
  }
}
