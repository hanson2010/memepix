import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import type { Meme, Category } from '@/types'

export function serverTimestamp(): FieldValue {
  return FieldValue.serverTimestamp()
}

export function timestampToDate(timestamp: Timestamp | undefined): Date {
  if (!timestamp) return new Date()
  return timestamp.toDate()
}

export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date)
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function toMeme(doc: FirebaseFirestore.DocumentSnapshot): Meme | null {
  if (!doc.exists) return null
  
  const data = doc.data()
  return {
    id: doc.id,
    imageUrl: data?.imageUrl || '',
    description: data?.description || '',
    category: data?.category || '',
    tags: data?.tags || [],
    locationTag: data?.locationTag,
    createdAt: timestampToDate(data?.createdAt),
    updatedAt: timestampToDate(data?.updatedAt),
  }
}

export function toCategory(doc: FirebaseFirestore.DocumentSnapshot): Category | null {
  if (!doc.exists) return null
  
  const data = doc.data()
  return {
    id: doc.id,
    name: data?.name || '',
    slug: data?.slug || '',
  }
}

export function toMemeList(snapshot: FirebaseFirestore.QuerySnapshot): Meme[] {
  return snapshot.docs.map(toMeme).filter((m): m is Meme => m !== null)
}

export function toCategoryList(snapshot: FirebaseFirestore.QuerySnapshot): Category[] {
  return snapshot.docs.map(toCategory).filter((c): c is Category => c !== null)
}
