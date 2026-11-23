'use client'

import { signIn } from 'next-auth/react'
import { PROVIDERS, PROVIDER_NAMES, ProviderIcon } from '@/components/ProviderIcon'

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: 'Sign-in was cancelled or refused. Please try again.',
}
const DEFAULT_ERROR = 'Sign-in did not complete. Please try again.'

interface SignInOptionsProps {
  /** Auth.js error code from the `error` query parameter */
  error?: string
  redirectTo?: string
}

export function SignInOptions({ error, redirectTo = '/' }: SignInOptionsProps) {
  return (
    <div className="w-full max-w-sm bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 text-center">Sign in to MemePix</h2>
      {error && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
          {ERROR_MESSAGES[error] ?? DEFAULT_ERROR}
        </p>
      )}
      <div className="space-y-3">
        {PROVIDERS.map((provider) => (
          <button
            key={provider}
            onClick={() => signIn(provider, { redirectTo })}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 hover:bg-gray-50 transition-colors text-sm min-h-[44px]"
          >
            <ProviderIcon provider={provider} />
            Sign in with {PROVIDER_NAMES[provider]}
          </button>
        ))}
      </div>
    </div>
  )
}
