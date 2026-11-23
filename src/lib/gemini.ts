import { GoogleGenerativeAI } from '@google/generative-ai'
import { secrets } from '@/lib/secrets'

let genAI: GoogleGenerativeAI | null = null

export function getGeminiClient(): GoogleGenerativeAI {
  if (genAI) {
    return genAI
  }

  genAI = new GoogleGenerativeAI(secrets.googleAiApiKey)
  return genAI
}

export function getVisionModel() {
  const client = getGeminiClient()
  return client.getGenerativeModel({ model: process.env.GOOGLE_AI_MODEL || 'gemini-3.5-flash-lite' })
}
