import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/session'
import { unlinkIdentity } from '@/lib/accounts'

interface RouteParams {
  params: Promise<{ id: string }>
}

/** Unlinks one of the signed-in account's identities */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    switch (await unlinkIdentity(session.user.id, decodeURIComponent(id))) {
      case 'unlinked':
        return NextResponse.json({ success: true })
      case 'last':
        return NextResponse.json({ error: 'You cannot unlink the only account you sign in with' }, { status: 409 })
      case 'not-found':
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error unlinking identity:', error)
    return NextResponse.json({ error: 'Failed to unlink' }, { status: 500 })
  }
}
