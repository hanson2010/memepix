import { getDb, tagsCollection, COLLECTIONS } from '@/lib/firebase'
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app'
import { getEnv } from '@/lib/env'

async function cleanupOrphanedTags() {
  const env = getEnv()
  
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId: env.GOOGLE_CLOUD_PROJECT,
    })
  }

  const db = getDb()
  const tagsSnapshot = await tagsCollection().where('count', '<=', 0).get()
  
  if (tagsSnapshot.empty) {
    console.log('No orphaned tags found')
    return { deleted: 0 }
  }

  const batch = db.batch()
  let deletedCount = 0

  for (const doc of tagsSnapshot.docs) {
    batch.delete(doc.ref)
    deletedCount++
    console.log(`Deleting tag: ${doc.id} (count: ${doc.data().count})`)
  }

  await batch.commit()
  console.log(`Deleted ${deletedCount} orphaned tags`)
  
  return { deleted: deletedCount }
}

export { cleanupOrphanedTags }
