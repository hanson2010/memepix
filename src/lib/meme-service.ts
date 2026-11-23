import { getDb, memesCollection, categoriesCollection, tagsCollection } from '@/lib/firebase'
import { serverTimestamp, toMeme, toMemeList, toCategory, toCategoryList, generateId } from '@/lib/firestore-utils'
import { FieldValue } from 'firebase-admin/firestore'
import type { Meme, MemeInput, Category, CategoryInput } from '@/types'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET_NAME } from '@/lib/r2'

function extractR2Key(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl)
    return url.pathname.slice(1)
  } catch {
    return null
  }
}

async function deleteR2Object(key: string): Promise<void> {
  try {
    await getR2Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }))
  } catch (error) {
    console.error(`Failed to delete ${key} from R2:`, error)
  }
}

// A tag no longer used by any meme gets expiresAt, and Firestore's TTL policy deletes it.
// Using the tag again clears expiresAt.
async function incrementTag(tag: string): Promise<void> {
  await tagsCollection().doc(tag).set(
    { count: FieldValue.increment(1), expiresAt: FieldValue.delete() },
    { merge: true }
  )
}

async function decrementTag(tag: string): Promise<void> {
  const tagRef = tagsCollection().doc(tag)
  await getDb().runTransaction(async (tx) => {
    const snapshot = await tx.get(tagRef)
    if (!snapshot.exists) return
    const count = (snapshot.data()?.count ?? 0) - 1
    tx.update(tagRef, { count, expiresAt: count > 0 ? FieldValue.delete() : new Date() })
  })
}

async function updateTagsOnCreate(tags: string[]): Promise<void> {
  for (const tag of tags || []) {
    await incrementTag(tag)
  }
}

async function updateTagsOnDelete(tags: string[]): Promise<void> {
  for (const tag of tags || []) {
    await decrementTag(tag)
  }
}

async function updateTagsOnUpdate(oldTags: string[], newTags: string[]): Promise<void> {
  const oldSet = new Set(oldTags || [])
  const newSet = new Set(newTags || [])

  for (const tag of newTags?.filter((t) => !oldSet.has(t)) || []) {
    await incrementTag(tag)
  }

  for (const tag of oldTags?.filter((t) => !newSet.has(t)) || []) {
    await decrementTag(tag)
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
    // Lowercased so existing memes can be claimed by an equal email (see claimMemes)
    data.uploadedBy = input.uploadedBy.toLowerCase()
  }

  if (input.ownerId !== undefined) {
    data.ownerId = input.ownerId
  }

  if (input.thumbnailUrl !== undefined) {
    data.thumbnailUrl = input.thumbnailUrl
  }
  
  await memesCollection().doc(id).set(data)
  
  const allTags = input.locationTag 
    ? [...input.tags, input.locationTag] 
    : input.tags
  await updateTagsOnCreate(allTags)
  
  return {
    id,
    ...input,
    uploadedBy: input.uploadedBy?.toLowerCase(),
    createdAt: now,
    updatedAt: now,
  }
}

export async function getMeme(id: string): Promise<Meme | null> {
  const doc = await memesCollection().doc(id).get()
  return toMeme(doc)
}

export async function updateMeme(id: string, input: Partial<MemeInput>): Promise<Meme | null> {
  const existingMeme = await getMeme(id)
  if (!existingMeme) return null
  
  const data: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
  }
  
  if (input.locationTag === undefined) {
    delete data.locationTag
  }
  
  await memesCollection().doc(id).update(data)
  
  const oldAllTags = existingMeme.locationTag 
    ? [...existingMeme.tags, existingMeme.locationTag]
    : existingMeme.tags
  const newAllTags = input.locationTag !== undefined
    ? [...(input.tags || existingMeme.tags), input.locationTag]
    : (input.tags || existingMeme.tags)
  
  await updateTagsOnUpdate(oldAllTags, newAllTags)
  
  return getMeme(id)
}

export async function deleteMeme(id: string, imageUrl?: string): Promise<void> {
  const meme = await getMeme(id)
  
  await memesCollection().doc(id).delete()
  
  if (meme) {
    const allTags = meme.locationTag 
      ? [...meme.tags, meme.locationTag]
      : meme.tags
    await updateTagsOnDelete(allTags)
  }
  
  for (const url of [imageUrl, meme?.thumbnailUrl]) {
    const key = url ? extractR2Key(url) : null
    if (key) await deleteR2Object(key)
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
