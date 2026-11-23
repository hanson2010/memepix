import type { Account, NextAuthConfig, Profile } from 'next-auth'
import { cookies } from 'next/headers'
import {
  accountExists,
  accountIdForIdentity,
  identityId,
  linkIdentity,
  resolveSignIn,
  type LinkResult,
} from '@/lib/accounts'
import { LINK_COOKIE, verifyLinkIntent } from '@/lib/link-intent'
import { githubIdentity, googleIdentity } from '@/lib/oauth-profile'
import type { Provider, ProviderIdentity } from '@/types'

export async function toProviderIdentity(account: Account, profile: Profile): Promise<ProviderIdentity | null> {
  switch (account.provider) {
    case 'google':
      return googleIdentity(profile as Parameters<typeof googleIdentity>[0])
    case 'github':
      return githubIdentity(profile as Parameters<typeof githubIdentity>[0], account.access_token)
    default:
      return null
  }
}

/** Where the account page shows the result of linking an identity */
function linkResultUrl(provider: string, result: LinkResult): string {
  switch (result.outcome) {
    case 'linked':
      return `/account?linked=${provider}`
    case 'already':
      return `/account?already=${provider}`
    case 'merge':
      return `/account?merge=${result.mergeId}`
    case 'gone':
      return '/auth/signin'
  }
}

/** The account the browser is signed in to before this sign-in, if any */
async function currentAccountId(): Promise<string | undefined> {
  // Imported here: src/lib/auth.ts imports this module
  const { auth } = await import('@/lib/auth')
  return (await auth())?.user?.id
}

/**
 * The account a pending link is for, if the browser asked to link and is still signed in
 * to that account. The link cookie is single-use, so it is cleared either way.
 */
async function consumeLinkIntent(): Promise<string | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(LINK_COOKIE)?.value
  if (!value) return null
  cookieStore.delete(LINK_COOKIE)

  const accountId = verifyLinkIntent(value)
  if (!accountId) return null
  // Ignore a leftover intent, e.g. after cancelling a link and signing out
  return (await currentAccountId()) === accountId ? accountId : null
}

// Accounts and identities live in Firestore (src/lib/accounts.ts); the session is a JWT
// carrying the account ID, checked against Firestore on every use so merged-away accounts sign out.
export const callbacks: NonNullable<NextAuthConfig['callbacks']> = {
  async signIn({ account, profile }) {
    if (!account || !profile) return false
    const identity = await toProviderIdentity(account, profile)
    if (!identity) return false

    const linkTo = await consumeLinkIntent()
    if (linkTo) {
      // Redirecting instead of returning true keeps the browser signed in to linkTo
      return linkResultUrl(identity.provider, await linkIdentity(linkTo, identity))
    }

    await resolveSignIn(identity)
    return true
  },

  async jwt({ token, account }) {
    if (account) {
      token.accountId =
        (await accountIdForIdentity(identityId(account.provider as Provider, account.providerAccountId))) ?? undefined
    }
    if (!token.accountId || !(await accountExists(token.accountId))) return null
    return token
  },

  async session({ session, token }) {
    session.user.id = token.accountId as string
    return session
  },
}
