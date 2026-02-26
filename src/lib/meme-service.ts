import { memesCollection, categoriesCollection } from '@/lib/firebase'
import { serverTimestamp, toMeme, toMemeList, toCategory, toCategoryList, generateId } from '@/lib/firestore-utils'
import type { Meme, MemeInput, Category, CategoryInput } from '@/types'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getEnv } from './env'

function getR2Client(): S3Client {
  const env = getEnv()
  return new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  })
}

function extractR2Key(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl)
    return url.pathname.slice(1)
  } catch {
    return null
  }
}

export async function createMeme(input: MemeInput): Promise<Meme> {
  const id = generateId()
  const now = new Date()
  
  const data: Record<string, unknown> = {
    imageUrl: input.imageUrl,
    description: input.description,
    category: input.category,
    tags: input.tags,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  
  if (input.locationTag !== undefined) {
    data.locationTag = input.locationTag
  }
  
  if (input.uploadedBy !== undefined) {
    data.uploadedBy = input.uploadedBy
  }
  
  await memesCollection().doc(id).set(data)
  
  return {
    id,
    ...input,
    createdAt: now,
    updatedAt: now,
  }
}

export async function getMeme(id: string): Promise<Meme | null> {
  const doc = await memesCollection().doc(id).get()
  return toMeme(doc)
}

export async function updateMeme(id: string, input: Partial<MemeInput>): Promise<Meme | null> {
  const data: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
  }
  
  if (input.locationTag === undefined) {
    delete data.locationTag
  }
  
  await memesCollection().doc(id).update(data)
  
  return getMeme(id)
}

export async function deleteMeme(id: string, imageUrl?: string): Promise<void> {
  await memesCollection().doc(id).delete()
  
  if (imageUrl) {
    const key = extractR2Key(imageUrl)
    if (key) {
      try {
        const env = getEnv()
        const client = getR2Client()
        await client.send(new DeleteObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: key,
        }))
      } catch (error) {
        console.error('Failed to delete from R2:', error)
      }
    }
  }
}

export async function listMemes(options?: {
  category?: string
  tags?: string[]
  limit?: number
  offset?: number
}): Promise<Meme[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = memesCollection()
  
  if (options?.category) {
    query = query.where('category', '==', options.category)
  }
  
  if (options?.tags && options.tags.length > 0) {
    query = query.where('tags', 'array-contains-any', options.tags)
  }
  
  query = query.orderBy('createdAt', 'desc')
  
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  
  if (options?.offset) {
    query = query.offset(options.offset)
  }
  
  const snapshot = await query.get()
  return toMemeList(snapshot)
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const id = generateId()
  
  await categoriesCollection().doc(id).set(input)
  
  return {
    id,
    ...input,
  }
}

export async function getCategory(id: string): Promise<Category | null> {
  const doc = await categoriesCollection().doc(id).get()
  return toCategory(doc)
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const snapshot = await categoriesCollection().where('slug', '==', slug).limit(1).get()
  
  if (snapshot.empty) return null
  
  return toCategory(snapshot.docs[0])
}

export async function listCategories(): Promise<Category[]> {
  const snapshot = await categoriesCollection().orderBy('name').get()
  return toCategoryList(snapshot)
}
