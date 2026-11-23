'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { PROVIDERS, PROVIDER_NAMES, ProviderIcon } from '@/components/ProviderIcon'
import type { Provider } from '@/types'

export interface AccountIdentity {
  id: string
  provider: Provider
  email: string | null
  name: string | null
}

interface AccountPanelProps {
  /** Provider just linked */
  linked?: string
  /** Provider whose identity was already on this account */
  already?: string
  /** Pending merge waiting for confirmation */
  merge?: string
  error?: string
}

function providerName(provider: string | undefined): string {
  return PROVIDER_NAMES[provider as Provider] ?? 'That'
}

interface MergeSummary {
  identities: { id: string; provider: Provider; email: string | null }[]
  memeCount: number
}

async function fetchIdentities(): Promise<AccountIdentity[] | null> {
  const res = await fetch('/api/account')
  return res.ok ? (await res.json()).identities : null
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

export function AccountPanel({ linked, already, merge, error }: AccountPanelProps) {
  const router = useRouter()
  const [mergeSummary, setMergeSummary] = useState<MergeSummary | null>(null)
  const [merging, setMerging] = useState(false)
  const [identities, setIdentities] = useState<AccountIdentity[] | null>(null)
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(() => {
    if (linked) return { text: `${providerName(linked)} is now linked to your account.` }
    if (already) return { text: `That ${providerName(already)} account is already linked to your account.` }
    if (error) return { text: 'Linking did not complete. Nothing was changed.', isError: true }
    return null
  })

  const load = useCallback(async () => {
    const list = await fetchIdentities()
    if (list) setIdentities(list)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchIdentities().then((list) => {
      if (list && !cancelled) setIdentities(list)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!merge) return
    fetch(`/api/account/merges/${merge}`).then(async (res) => {
      const body = await res.json()
      if (res.ok) setMergeSummary(body)
      else setMessage({ text: body.error || 'This merge is no longer available.', isError: true })
    })
  }, [merge])

  /** Drops ?merge= from the URL so a reload does not offer the merge again */
  function closeMerge() {
    setMergeSummary(null)
    router.replace('/account')
  }

  async function confirmMerge() {
    setMerging(true)
    const res = await fetch(`/api/account/merges/${merge}`, { method: 'POST' })
    const body = await res.json()
    setMerging(false)
    if (!res.ok) {
      setMessage({ text: body.error || 'Merging did not finish. Please try again.', isError: true })
      return
    }
    setMessage({ text: `Accounts merged: ${plural(body.memes, 'meme')} moved to this account.` })
    closeMerge()
    await load()
  }

  async function unlink(identity: AccountIdentity) {
    const res = await fetch(`/api/account/identities/${encodeURIComponent(identity.id)}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setMessage({ text: body.error || 'Could not unlink. Please try again.', isError: true })
      return
    }
    const label = identity.email ? `${PROVIDER_NAMES[identity.provider]} account ${identity.email}` : `${PROVIDER_NAMES[identity.provider]} account`
    setMessage({ text: `${label} is no longer linked.` })
    await load()
  }

  async function cancelMerge() {
    await fetch(`/api/account/merges/${merge}`, { method: 'DELETE' })
    setMessage({ text: 'Merge cancelled. Nothing was changed.' })
    closeMerge()
  }

  async function link(provider: Provider) {
    const res = await fetch('/api/account/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    })
    if (!res.ok) {
      setMessage({ text: 'Could not start linking. Please try again.', isError: true })
      return
    }
    await signIn(provider, { redirectTo: '/account' })
  }

  return (
    <div className="space-y-6">
      {message && (
        <p
          role={message.isError ? 'alert' : 'status'}
          className={`text-sm rounded-lg px-3 py-2 ${message.isError ? 'text-red-700 bg-red-50' : 'text-green-800 bg-green-50'}`}
        >
          {message.text}
        </p>
      )}

      {mergeSummary && (
        <section role="dialog" aria-labelledby="merge-title" className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-6">
          <h3 id="merge-title" className="font-medium text-gray-900 mb-2">Merge another MemePix account into this one?</h3>
          <p className="text-sm text-gray-700 mb-2">
            The account you signed in with belongs to another MemePix account. Merging moves these sign-in accounts
            and {plural(mergeSummary.memeCount, 'meme')} to this account, and removes the other account. This cannot be undone here.
          </p>
          <ul className="text-sm text-gray-700 mb-4 list-disc pl-5">
            {mergeSummary.identities.map((identity) => (
              <li key={identity.id}>
                {PROVIDER_NAMES[identity.provider]}: {identity.email ?? 'no email'}
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <button
              onClick={confirmMerge}
              disabled={merging}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm min-h-[44px] disabled:opacity-50"
            >
              {merging ? 'Merging...' : 'Merge accounts'}
            </button>
            <button
              onClick={cancelMerge}
              disabled={merging}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm min-h-[44px] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      <section className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="font-medium text-gray-900 mb-3">Sign-in accounts</h3>
        {identities === null ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {identities.map((identity) => (
              <li key={identity.id} className="flex items-center gap-3 py-3">
                <ProviderIcon provider={identity.provider} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{PROVIDER_NAMES[identity.provider]}</p>
                  <p className="text-sm text-gray-600 truncate">{identity.email ?? identity.name ?? 'No email'}</p>
                </div>
                {identities.length > 1 && (
                  <button
                    onClick={() => unlink(identity)}
                    aria-label={`Unlink ${PROVIDER_NAMES[identity.provider]} ${identity.email ?? ''}`.trim()}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm min-h-[44px]"
                  >
                    Unlink
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="font-medium text-gray-900 mb-1">Link another account</h3>
        <p className="text-sm text-gray-600 mb-3">
          Sign in with another Google or GitHub account to use it for this MemePix account too.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {PROVIDERS.map((provider) => (
            <button
              key={provider}
              onClick={() => link(provider)}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 hover:bg-gray-50 transition-colors text-sm min-h-[44px]"
            >
              <ProviderIcon provider={provider} />
              Link {PROVIDER_NAMES[provider]}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
