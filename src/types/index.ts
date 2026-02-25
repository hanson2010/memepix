export interface Meme {
  id: string
  imageUrl: string
  description: string
  category: string
  tags: string[]
  locationTag?: string
  createdAt: Date
  updatedAt: Date
}

export interface MemeInput {
  imageUrl: string
  description: string
  category: string
  tags: string[]
  locationTag?: string
}

export interface Category {
  id: string
  name: string
  slug: string
}

export interface CategoryInput {
  name: string
  slug: string
}

export type MemeStatus = 'pending' | 'analyzing' | 'ready' | 'error'

export interface UploadState {
  status: MemeStatus
  imageUrl?: string
  error?: string
  aiSuggestion?: {
    description?: string
    locationTag?: string
  }
}
