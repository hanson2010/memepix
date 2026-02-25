import type { NextAuthOptions } from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import { getEnv } from './env'

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: getEnv().GITHUB_CLIENT_ID,
      clientSecret: getEnv().GITHUB_CLIENT_SECRET,
      httpOptions: {
        timeout: 10000,
      },
    }),
  ],
  secret: getEnv().NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string | undefined,
      }
    },
  },
}
