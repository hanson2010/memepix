import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import { callbacks } from '@/lib/auth-callbacks'
import { secrets } from '@/lib/secrets'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: secrets.nextauthSecret,
  // Host comes from the request; Cloud Run sits behind Google's proxy
  trustHost: true,
  // Listed in the order the sign-in page offers them
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: secrets.googleClientSecret,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: secrets.githubClientSecret,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
})
