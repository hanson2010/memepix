import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/session'
import { cancelMerge, executeMerge, getPendingMerge, mergeSummary } from '@/lib/accounts'

interface RouteParams {
  params: Promise<{ id: string }>
}

const REFUSED = {
  'not-found': { error: 'Merge not found', status: 404 },
  forbidden: { error: 'Forbidden', status: 403 },
  expired: { error: 'This merge has expired. Link the account again to merge it.', status: 410 },
} as const

/** The pending merge, if the signed-in account is the one it merges into */
async function lookup(params: RouteParams['params']) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const { id } = await params
  const result = await getPendingMerge(id, session.user.id)
  if (result.status !== 'ok') {
    const { error, status } = REFUSED[result.status]
    return { response: NextResponse.json({ error }, { status }) }
  }
  return { id, merge: result.merge }
}

/** What confirming the merge would move to the signed-in account */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const found = await lookup(params)
    if (found.response) return found.response
    return NextResponse.json(await mergeSummary(found.merge))
  } catch (error) {
    console.error('Error reading merge:', error)
    return NextResponse.json({ error: 'Failed to read merge' }, { status: 500 })
  }
}

/** Confirms the merge */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const found = await lookup(params)
    if (found.response) return found.response
    return NextResponse.json(await executeMerge(found.id, found.merge))
  } catch (error) {
    console.error('Error merging accounts:', error)
    return NextResponse.json({ error: 'Merging did not finish. Confirm again to complete it.' }, { status: 500 })
  }
}

/** Cancels the merge; both accounts stay as they are */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const found = await lookup(params)
    if (found.response) return found.response
    await cancelMerge(found.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling merge:', error)
    return NextResponse.json({ error: 'Failed to cancel merge' }, { status: 500 })
  }
}
