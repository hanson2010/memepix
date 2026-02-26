import { NextRequest, NextResponse } from 'next/server'
import { getVisionModel } from '@/lib/gemini'

const ANALYSIS_TIMEOUT = 30000

const ANALYSIS_PROMPT = `Analyze this image and provide location information in English.

First, check for Chinese-to-English translations that may be improper or humorous:
- Grammatical errors, mistranslations, or awkward phrasing
- Humorous or unintentional meanings

Then, extract any GPS coordinates from the image EXIF data if available.

If no EXIF data is found, examine the image for geographical indicators such as:
- Street signs, road names, traffic signs, and license plates
- Landmarks and notable buildings
- Currency or postal codes visible
- Any text that indicates a specific location

Provide your analysis in JSON format:
{
  "hasTranslation": boolean,
  "description": "string (description of any translation humor or error, empty if nothing found)",
  "locationHint": "string (location detected from EXIF or visual indicators, in English, empty if nothing found)"
}

Always provide locationHint in English if any geographical information is detected, even if no translation is found.`

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
        locationHint: '',
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
          locationHint: '',
        })
      }

      const analysis = JSON.parse(jsonMatch[0])

      return NextResponse.json({
        hasTranslation: analysis.hasTranslation ?? false,
        description: analysis.description ?? '',
        locationHint: analysis.locationHint ?? '',
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
