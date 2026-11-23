import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/session'
import { listIdentities } from '@/lib/accounts'
import { PROVIDERS } from '@/lib/providers'

/** The label the account page shows for an identity */
function label(identity: { email: string | null; name: string | null; id: string }): string {
  return identity.email ?? identity.name ?? identity.id
}

/** The signed-in account's identities: Google, then GitHub, each alphabetically */
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const identities = await listIdentities(session.user.id)
  return NextResponse.json({
    identities: identities
      .map(({ id, provider, email, name }) => ({ id, provider, email, name }))
      .sort(
        (a, b) =>
          PROVIDERS.indexOf(a.provider) - PROVIDERS.indexOf(b.provider) ||
          label(a).localeCompare(label(b), undefined, { sensitivity: 'base' })
      ),
  })
}
