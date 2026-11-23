'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="px-4 py-2 text-gray-500 min-h-[44px] flex items-center">
        Loading...
      </div>
    )
  }

  if (session) {
    const name = session.user?.name || session.user?.email || 'Account'
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/account"
          title="Your account"
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-0"
        >
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 rounded-full shrink-0"
            />
          )}
          <span className="text-sm text-gray-700 truncate max-w-[160px]">{name}</span>
        </Link>
        <button
          onClick={() => signOut({ redirectTo: '/' })}
          aria-label="Sign out"
          title="Sign out"
          className="flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors min-h-[44px] min-w-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 16l4-4m0 0l-4-4m4 4H9m4 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/auth/signin"
      className="flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm min-h-[44px]"
    >
      Sign in
    </Link>
  )
}
