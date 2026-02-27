import { NextResponse } from 'next/server'
import { getDb, tagsCollection } from '@/lib/firebase'
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app'

export const dynamic = 'force-dynamic'

async function cleanupOrphanedTags() {
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
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

export async function GET() {
  try {
    const result = await cleanupOrphanedTags()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error cleaning up tags:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
