// One-off: lowercases `uploadedBy` on every meme so accounts can claim existing memes
// by an exact email match. Safe to run more than once and while the previous version is live.
//
// Usage (with GOOGLE_CLOUD_PROJECT and Firestore credentials set, e.g. from .env.local):
//   node scripts/lowercase-uploaded-by.mjs --dry-run   # list what would change
//   node scripts/lowercase-uploaded-by.mjs             # apply

import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const dryRun = process.argv.includes('--dry-run')

initializeApp({ credential: applicationDefault(), projectId: process.env.GOOGLE_CLOUD_PROJECT })
const db = getFirestore()

const snapshot = await db.collection('memes').get()
const changes = snapshot.docs.filter((doc) => {
  const uploadedBy = doc.data().uploadedBy
  return typeof uploadedBy === 'string' && uploadedBy !== uploadedBy.toLowerCase()
})

for (const doc of changes) {
  const uploadedBy = doc.data().uploadedBy
  console.log(`${doc.id}: ${uploadedBy} -> ${uploadedBy.toLowerCase()}`)
}

if (!dryRun) {
  // Firestore allows at most 500 writes per batch
  for (let i = 0; i < changes.length; i += 500) {
    const batch = db.batch()
    for (const doc of changes.slice(i, i + 500)) {
      batch.update(doc.ref, { uploadedBy: doc.data().uploadedBy.toLowerCase() })
    }
    await batch.commit()
  }
}

console.log(`${snapshot.size} memes, ${changes.length} ${dryRun ? 'to change (dry run)' : 'changed'}`)
