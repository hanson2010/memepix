import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const signIn = vi.fn()
vi.mock('next-auth/react', () => ({ signIn: (...args: unknown[]) => signIn(...args) }))
const replace = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }))

const { AccountPanel } = await import('@/components/AccountPanel')

type Route = (init?: RequestInit) => { status?: number; body: unknown }
let routes: Record<string, Route>
const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
  const key = `${init?.method ?? 'GET'} ${url}`
  const route = routes[key]
  if (!route) throw new Error(`Unexpected request: ${key}`)
  const { status = 200, body } = route(init)
  return { ok: status < 400, status, json: async () => body } as Response
})

const twoIdentities = [
  { id: 'github:1', provider: 'github', email: 'gh@example.com', name: 'octo' },
  { id: 'google:2', provider: 'google', email: 'go@example.com', name: 'Ann' },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  routes = { 'GET /api/account': () => ({ body: { identities: twoIdentities } }) }
})

describe('AccountPanel', () => {
  it('lists each identity with its provider and email', async () => {
    render(<AccountPanel />)
    expect(await screen.findByText('gh@example.com')).toBeInTheDocument()
    expect(screen.getByText('go@example.com')).toBeInTheDocument()
    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Google')).toBeInTheDocument()
  })

  it('offers Link Google then Link GitHub', async () => {
    render(<AccountPanel />)
    const links = screen.getAllByRole('button', { name: /^Link / }).map((b) => b.textContent)
    expect(links).toEqual(['Link Google', 'Link GitHub'])
  })

  it('records the link intent, then signs in with the provider and returns to the account page', async () => {
    routes['POST /api/account/link'] = (init) => ({ body: JSON.parse(String(init?.body)) })
    render(<AccountPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Link Google' }))
    await waitFor(() => expect(signIn).toHaveBeenCalledWith('google', { redirectTo: '/account' }))
    expect(fetchMock).toHaveBeenCalledWith('/api/account/link', expect.objectContaining({ method: 'POST', body: '{"provider":"google"}' }))
  })

  it('shows an error and does not sign in when linking cannot start', async () => {
    routes['POST /api/account/link'] = () => ({ status: 401, body: {} })
    render(<AccountPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Link GitHub' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not start linking')
    expect(signIn).not.toHaveBeenCalled()
  })

  it.each([
    [{ linked: 'google' }, 'Google is now linked to your account.'],
    [{ already: 'github' }, 'That GitHub account is already linked to your account.'],
    [{ error: 'link' }, 'Linking did not complete. Nothing was changed.'],
  ])('shows the result of a link: %o', async (props, text) => {
    render(<AccountPanel {...props} />)
    expect(screen.getByText(text)).toBeInTheDocument()
    await screen.findByText('gh@example.com')
  })
})

describe('AccountPanel: merge confirmation', () => {
  beforeEach(() => {
    routes['GET /api/account/merges/pm1'] = () => ({
      body: { identities: [{ id: 'google:b', provider: 'google', email: 'b@example.com' }], memeCount: 3 },
    })
  })

  it('shows what will move and asks for confirmation', async () => {
    render(<AccountPanel merge="pm1" />)
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('3 memes')
    expect(dialog).toHaveTextContent('Google: b@example.com')
    expect(screen.getByRole('button', { name: 'Merge accounts' })).toBeInTheDocument()
  })

  it('merges on confirmation and reloads the identities', async () => {
    routes['POST /api/account/merges/pm1'] = () => ({ body: { identities: 1, memes: 3 } })
    render(<AccountPanel merge="pm1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Merge accounts' }))
    expect(await screen.findByText('Accounts merged: 3 memes moved to this account.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(replace).toHaveBeenCalledWith('/account')
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/account')).toHaveLength(2)
  })

  it('cancels without merging', async () => {
    routes['DELETE /api/account/merges/pm1'] = () => ({ body: { success: true } })
    render(<AccountPanel merge="pm1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(await screen.findByText('Merge cancelled. Nothing was changed.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalledWith('/api/account/merges/pm1', expect.objectContaining({ method: 'POST' }))
  })

  it('explains an expired merge instead of offering it', async () => {
    routes['GET /api/account/merges/pm1'] = () => ({
      status: 410,
      body: { error: 'This merge has expired. Link the account again to merge it.' },
    })
    render(<AccountPanel merge="pm1" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('expired')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('keeps the confirmation open and says so when merging fails', async () => {
    routes['POST /api/account/merges/pm1'] = () => ({ status: 500, body: { error: 'Merging did not finish. Confirm again to complete it.' } })
    render(<AccountPanel merge="pm1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Merge accounts' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Confirm again')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('AccountPanel: unlinking', () => {
  it('offers Unlink on each identity when there are two or more', async () => {
    render(<AccountPanel />)
    await screen.findByText('gh@example.com')
    expect(screen.getAllByRole('button', { name: /^Unlink/ })).toHaveLength(2)
  })

  it('offers no Unlink for the only identity', async () => {
    routes['GET /api/account'] = () => ({ body: { identities: [twoIdentities[0]] } })
    render(<AccountPanel />)
    await screen.findByText('gh@example.com')
    expect(screen.queryByRole('button', { name: /^Unlink/ })).toBeNull()
  })

  it('unlinks and reloads the list', async () => {
    let unlinked = false
    routes['DELETE /api/account/identities/github%3A1'] = () => {
      unlinked = true
      return { body: { success: true } }
    }
    routes['GET /api/account'] = () => ({ body: { identities: unlinked ? [twoIdentities[1]] : twoIdentities } })
    render(<AccountPanel />)
    fireEvent.click(await screen.findByRole('button', { name: 'Unlink GitHub gh@example.com' }))
    expect(await screen.findByText('GitHub account gh@example.com is no longer linked.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('gh@example.com')).toBeNull())
  })
})
