import { memesCollection, categoriesCollection } from '@/lib/firebase'
import { serverTimestamp, toMeme, toMemeList, toCategory, toCategoryList, generateId } from '@/lib/firestore-utils'
import type { Meme, MemeInput, Category, CategoryInput } from '@/types'

export async function createMeme(input: MemeInput): Promise<Meme> {
  const id = generateId()
  const now = new Date()
  
  await memesCollection().doc(id).set({
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  
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
  await memesCollection().doc(id).update({
    ...input,
    updatedAt: serverTimestamp(),
  })
  
  return getMeme(id)
}

export async function deleteMeme(id: string): Promise<void> {
  await memesCollection().doc(id).delete()
}

export async function listMemes(options?: {
  category?: string
  tags?: string[]
  limit?: number
  offset?: number
}): Promise<Meme[]> {
  let query = memesCollection().orderBy('createdAt', 'desc')
  
  if (options?.category) {
    query = query.where('category', '==', options.category)
  }
  
  if (options?.tags && options.tags.length > 0) {
    query = query.where('tags', 'array-contains-any', options.tags)
  }
  
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
