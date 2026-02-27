import { initializeApp, applicationDefault, getApps, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getEnv } from './env'

let app: App | null = null
let db: Firestore | null = null

export function getFirebaseApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]
  }
  
  if (app) {
    return app
  }
  
  const env = getEnv()
  
  app = initializeApp({
    credential: applicationDefault(),
    projectId: env.GOOGLE_CLOUD_PROJECT,
  })
  
  return app
}

export function getDb(): Firestore {
  if (db) {
    return db
  }
  
  getFirebaseApp()
  db = getFirestore()
  return db
}

export const COLLECTIONS = {
  MEMES: 'memes',
  CATEGORIES: 'categories',
  TAGS: 'tags',
} as const

export function memesCollection() {
  return getDb().collection(COLLECTIONS.MEMES)
}

export function categoriesCollection() {
  return getDb().collection(COLLECTIONS.CATEGORIES)
}

export function tagsCollection() {
  return getDb().collection(COLLECTIONS.TAGS)
}
