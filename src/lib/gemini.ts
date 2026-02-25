import { GoogleGenerativeAI } from '@google/generative-ai'
import { getEnv } from './env'

let genAI: GoogleGenerativeAI | null = null

export function getGeminiClient(): GoogleGenerativeAI {
  if (genAI) {
    return genAI
  }
  
  const env = getEnv()
  genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY)
  return genAI
}

export function getVisionModel() {
  const client = getGeminiClient()
  return client.getGenerativeModel({ model: 'gemini-pro-vision' })
}
