export interface Meme {
  id: string
  imageUrl: string
  description: string
  category: string
  tags: string[]
  locationTag?: string
  uploadedBy?: string
  /** Gallery thumbnail (WebP in R2); missing for memes uploaded before thumbnails existed */
  thumbnailUrl?: string
  /** Account ID of the meme's owner; missing until an account claims the meme */
  ownerId?: string
  createdAt: Date
  updatedAt: Date
}

export interface MemeInput {
  imageUrl: string
  description: string
  category: string
  tags: string[]
  locationTag?: string
  uploadedBy?: string
  ownerId?: string
  thumbnailUrl?: string
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
  thumbnailUrl?: string
  error?: string
  aiSuggestion?: {
    description?: string
    locationTag?: string
    hasTranslation?: boolean
  }
}

export type Provider = 'google' | 'github'

/** A Google or GitHub account as reported by the provider at sign-in */
export interface ProviderIdentity {
  provider: Provider
  providerAccountId: string
  /** Lowercased; null when the provider gives none */
  email: string | null
  emailVerified: boolean
  name: string | null
  image: string | null
}

/** An identity stored on a Memepix account */
export interface Identity extends ProviderIdentity {
  /** `{provider}:{providerAccountId}` */
  id: string
  accountId: string
}
