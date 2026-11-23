import { COLLECTIONS, getDb } from '@/lib/firebase'
import type { Identity, Provider, ProviderIdentity } from '@/types'

type Tx = FirebaseFirestore.Transaction

/** Firestore allows at most 500 writes per batch */
const BATCH_SIZE = 500

export function identityId(provider: Provider, providerAccountId: string): string {
  return `${provider}:${providerAccountId}`
}

function identityFields(p: ProviderIdentity) {
  return {
    provider: p.provider,
    providerAccountId: p.providerAccountId,
    email: p.email,
    emailVerified: p.emailVerified,
    name: p.name,
    image: p.image,
  }
}

/** The one account with an identity holding this verified email, or null when none or several */
async function accountByVerifiedEmail(tx: Tx, email: string): Promise<string | null> {
  const snapshot = await tx.get(
    getDb().collection(COLLECTIONS.IDENTITIES).where('email', '==', email).where('emailVerified', '==', true)
  )
  const accountIds = new Set(snapshot.docs.map((doc) => doc.data().accountId as string))
  return accountIds.size === 1 ? [...accountIds][0] : null
}

/**
 * Finds or creates the account an identity signs in to: its own account if it has one,
 * otherwise the one account whose identities share its verified email, otherwise a new account.
 * Returns the account ID.
 */
export async function resolveSignIn(p: ProviderIdentity): Promise<string> {
  const db = getDb()
  const ref = db.collection(COLLECTIONS.IDENTITIES).doc(identityId(p.provider, p.providerAccountId))
  const now = new Date()

  const { accountId, claim } = await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref)
    if (snapshot.exists) {
      const previous = snapshot.data() as Identity
      tx.update(ref, { ...identityFields(p), updatedAt: now })
      const newlyVerified = p.emailVerified && (!previous.emailVerified || previous.email !== p.email)
      return { accountId: previous.accountId, claim: newlyVerified }
    }

    let accountId = p.emailVerified && p.email ? await accountByVerifiedEmail(tx, p.email) : null
    if (!accountId) {
      accountId = db.collection(COLLECTIONS.USERS).doc().id
      tx.set(db.collection(COLLECTIONS.USERS).doc(accountId), {
        name: p.name,
        image: p.image,
        createdAt: now,
        updatedAt: now,
      })
    }
    tx.set(ref, { ...identityFields(p), accountId, linkedAt: now, updatedAt: now })
    return { accountId, claim: p.emailVerified }
  })

  if (claim && p.email) {
    await claimMemes(accountId, p.email)
  }
  return accountId
}

/** Gives the account every meme with this uploader email that has no owner yet */
export async function claimMemes(accountId: string, email: string): Promise<number> {
  const db = getDb()
  const snapshot = await db.collection(COLLECTIONS.MEMES).where('uploadedBy', '==', email.toLowerCase()).get()
  const unowned = snapshot.docs.filter((doc) => !doc.data().ownerId)

  for (let i = 0; i < unowned.length; i += BATCH_SIZE) {
    const batch = db.batch()
    for (const doc of unowned.slice(i, i + BATCH_SIZE)) {
      batch.update(doc.ref, { ownerId: accountId })
    }
    await batch.commit()
  }
  return unowned.length
}

export async function accountExists(accountId: string): Promise<boolean> {
  const snapshot = await getDb().collection(COLLECTIONS.USERS).doc(accountId).get()
  return snapshot.exists
}

export async function listIdentities(accountId: string): Promise<Identity[]> {
  const snapshot = await getDb().collection(COLLECTIONS.IDENTITIES).where('accountId', '==', accountId).get()
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Identity)
}

/** The account an identity belongs to, or null when it belongs to none */
export async function accountIdForIdentity(id: string): Promise<string | null> {
  const snapshot = await getDb().collection(COLLECTIONS.IDENTITIES).doc(id).get()
  return snapshot.exists ? (snapshot.data()!.accountId as string) : null
}

/** How long a merge waits for the user to confirm */
export const PENDING_MERGE_MINUTES = 10

export type LinkResult =
  | { outcome: 'linked' }
  | { outcome: 'already' }
  | { outcome: 'merge'; mergeId: string }
  | { outcome: 'gone' }

/**
 * Links an identity to the signed-in account. An identity with no account joins it; one that
 * belongs to another account starts a pending merge, which the user confirms or cancels.
 */
export async function linkIdentity(accountId: string, p: ProviderIdentity): Promise<LinkResult> {
  const db = getDb()
  const id = identityId(p.provider, p.providerAccountId)
  const ref = db.collection(COLLECTIONS.IDENTITIES).doc(id)
  const now = new Date()

  const result = await db.runTransaction(async (tx): Promise<LinkResult> => {
    const [account, snapshot] = await Promise.all([
      tx.get(db.collection(COLLECTIONS.USERS).doc(accountId)),
      tx.get(ref),
    ])
    if (!account.exists) return { outcome: 'gone' }

    if (!snapshot.exists) {
      tx.set(ref, { ...identityFields(p), accountId, linkedAt: now, updatedAt: now })
      return { outcome: 'linked' }
    }

    tx.update(ref, { ...identityFields(p), updatedAt: now })
    const otherId = (snapshot.data() as Identity).accountId
    if (otherId === accountId) return { outcome: 'already' }

    const mergeRef = db.collection(COLLECTIONS.PENDING_MERGES).doc()
    tx.set(mergeRef, {
      survivorId: accountId,
      otherId,
      identityId: id,
      createdAt: now,
      expiresAt: new Date(now.getTime() + PENDING_MERGE_MINUTES * 60 * 1000),
    })
    return { outcome: 'merge', mergeId: mergeRef.id }
  })

  if (result.outcome === 'linked' && p.emailVerified && p.email) {
    await claimMemes(accountId, p.email)
  }
  return result
}

interface PendingMerge {
  survivorId: string
  otherId: string
  identityId: string
  createdAt: Date
  expiresAt: Date
  /** Set once the merge has started; it may then finish even after the confirmation window */
  startedAt?: Date
  movedIdentityIds?: string[]
  movedMemeIds?: string[]
}

export type PendingMergeLookup =
  | { status: 'ok'; merge: PendingMerge }
  | { status: 'not-found' | 'forbidden' | 'expired' }

function toDate(value: unknown): Date {
  // Firestore returns Timestamps; tests store Dates
  return value instanceof Date ? value : (value as FirebaseFirestore.Timestamp).toDate()
}

/** A pending merge the signed-in account may act on */
export async function getPendingMerge(mergeId: string, accountId: string, now = new Date()): Promise<PendingMergeLookup> {
  const snapshot = await getDb().collection(COLLECTIONS.PENDING_MERGES).doc(mergeId).get()
  if (!snapshot.exists) return { status: 'not-found' }
  const data = snapshot.data()!
  const merge = { ...data, createdAt: toDate(data.createdAt), expiresAt: toDate(data.expiresAt) } as PendingMerge
  if (merge.survivorId !== accountId) return { status: 'forbidden' }
  if (!merge.startedAt && merge.expiresAt <= now) return { status: 'expired' }
  return { status: 'ok', merge }
}

/** What would move to the signed-in account if the merge is confirmed */
export async function mergeSummary(merge: PendingMerge) {
  const [identities, memes] = await Promise.all([
    listIdentities(merge.otherId),
    getDb().collection(COLLECTIONS.MEMES).where('ownerId', '==', merge.otherId).count().get(),
  ])
  return {
    identities: identities.map(({ id, provider, email }) => ({ id, provider, email })),
    memeCount: memes.data().count,
  }
}

export async function cancelMerge(mergeId: string): Promise<void> {
  await getDb().collection(COLLECTIONS.PENDING_MERGES).doc(mergeId).delete()
}

/**
 * Moves everything of `field == from` in a collection to `to`, a batch at a time.
 * When `track` is given, each batch also appends the moved IDs to the pending merge,
 * so a merge retried after a failure still records everything it moved.
 */
async function moveOwnership(
  collection: string,
  field: string,
  from: string,
  to: string,
  track?: { ref: FirebaseFirestore.DocumentReference; key: 'movedIdentityIds' | 'movedMemeIds'; ids: string[] }
): Promise<void> {
  const db = getDb()
  for (;;) {
    const snapshot = await db.collection(collection).where(field, '==', from).limit(BATCH_SIZE - 1).get()
    if (snapshot.empty) return
    const batch = db.batch()
    for (const doc of snapshot.docs) {
      batch.update(doc.ref, { [field]: to })
    }
    if (track) {
      track.ids.push(...snapshot.docs.map((doc) => doc.id))
      batch.update(track.ref, { [track.key]: track.ids })
    }
    await batch.commit()
  }
}

/** Merges the other account of a confirmed pending merge into the surviving account */
export async function executeMerge(mergeId: string, merge: PendingMerge): Promise<{ identities: number; memes: number }> {
  const db = getDb()
  const mergeRef = db.collection(COLLECTIONS.PENDING_MERGES).doc(mergeId)
  const { survivorId, otherId } = merge
  const identityIds = [...(merge.movedIdentityIds ?? [])]
  const memeIds = [...(merge.movedMemeIds ?? [])]

  // Keep the pending merge from expiring while the merge runs
  const now = new Date()
  await mergeRef.update({
    startedAt: merge.startedAt ?? now,
    expiresAt: new Date(now.getTime() + PENDING_MERGE_MINUTES * 60 * 1000),
  })

  // Identities first, so a sign-in during the merge already lands in the surviving account
  await moveOwnership(COLLECTIONS.IDENTITIES, 'accountId', otherId, survivorId, {
    ref: mergeRef,
    key: 'movedIdentityIds',
    ids: identityIds,
  })
  await moveOwnership(COLLECTIONS.MEMES, 'ownerId', otherId, survivorId, {
    ref: mergeRef,
    key: 'movedMemeIds',
    ids: memeIds,
  })
  await moveOwnership(COLLECTIONS.UPLOADS, 'ownerId', otherId, survivorId)

  const batch = db.batch()
  batch.set(db.collection(COLLECTIONS.MERGES).doc(mergeId), {
    at: new Date(),
    survivorId,
    removedId: otherId,
    identityIds,
    memeIds,
  })
  batch.delete(db.collection(COLLECTIONS.USERS).doc(otherId))
  batch.delete(mergeRef)
  await batch.commit()

  return { identities: identityIds.length, memes: memeIds.length }
}

export type UnlinkResult = 'unlinked' | 'not-found' | 'last'

/** Removes an identity from the account unless it is the account's only identity */
export async function unlinkIdentity(accountId: string, id: string): Promise<UnlinkResult> {
  const db = getDb()
  const ref = db.collection(COLLECTIONS.IDENTITIES).doc(id)
  return db.runTransaction(async (tx) => {
    const [snapshot, all] = await Promise.all([
      tx.get(ref),
      tx.get(db.collection(COLLECTIONS.IDENTITIES).where('accountId', '==', accountId)),
    ])
    // Another account's identity is reported as missing, so its existence is not revealed
    if (!snapshot.exists || snapshot.data()!.accountId !== accountId) return 'not-found'
    if (all.size <= 1) return 'last'
    tx.delete(ref)
    return 'unlinked'
  })
}
