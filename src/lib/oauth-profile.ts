import type { ProviderIdentity } from '@/types'

type GoogleProfile = {
  sub: string
  email?: string | null
  email_verified?: boolean
  name?: string | null
  picture?: string | null
}

type GitHubProfile = {
  id: number | string
  login?: string
  email?: string | null
  name?: string | null
  avatar_url?: string | null
}

type GitHubEmail = { email: string; primary: boolean; verified: boolean }

/** Google states whether the address is verified in the `email_verified` claim */
export function googleIdentity(profile: GoogleProfile): ProviderIdentity {
  return {
    provider: 'google',
    providerAccountId: profile.sub,
    email: profile.email?.toLowerCase() ?? null,
    emailVerified: !!profile.email && profile.email_verified === true,
    name: profile.name ?? null,
    image: profile.picture ?? null,
  }
}

/**
 * GitHub's profile email is the public one and says nothing about verification,
 * so the primary address and its verified flag come from GET /user/emails.
 */
export async function githubIdentity(
  profile: GitHubProfile,
  accessToken: string | undefined,
  fetchFn: typeof fetch = fetch
): Promise<ProviderIdentity> {
  let primary: GitHubEmail | undefined
  if (accessToken) {
    try {
      const res = await fetchFn('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'memepix' },
      })
      if (res.ok) {
        const emails = (await res.json()) as GitHubEmail[]
        primary = emails.find((e) => e.primary)
      }
    } catch (error) {
      console.error('Failed to fetch GitHub emails:', error)
    }
  }

  const email = primary?.email ?? profile.email ?? null
  return {
    provider: 'github',
    providerAccountId: String(profile.id),
    email: email?.toLowerCase() ?? null,
    emailVerified: primary?.verified === true,
    name: profile.name ?? profile.login ?? null,
    image: profile.avatar_url ?? null,
  }
}
