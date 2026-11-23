import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const useSession = vi.fn()
vi.mock('next-auth/react', () => ({ useSession: () => useSession(), signOut: vi.fn() }))

const { AuthButton } = await import('@/components/AuthButton')

describe('AuthButton', () => {
  beforeEach(() => useSession.mockReset())

  it('links to the sign-in page when signed out', () => {
    useSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    render(<AuthButton />)
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/auth/signin')
  })

  it('links the avatar and name to the account page, and signs out from an icon button', () => {
    useSession.mockReturnValue({
      data: { user: { id: 'acct', name: 'Ann', image: 'https://avatars.githubusercontent.com/u/1' } },
      status: 'authenticated',
    })
    render(<AuthButton />)
    const accountLink = screen.getByRole('link', { name: 'Ann' })
    expect(accountLink).toHaveAttribute('href', '/account')
    expect(accountLink.querySelector('img')).not.toBeNull()
    const signOutButton = screen.getByRole('button', { name: 'Sign out' })
    expect(signOutButton.textContent).toBe('')
    expect(signOutButton).toHaveAttribute('title', 'Sign out')
  })

  it('falls back to the email when the provider gives no name', () => {
    useSession.mockReturnValue({ data: { user: { id: 'acct', email: 'ann@example.com' } }, status: 'authenticated' })
    render(<AuthButton />)
    expect(screen.getByRole('link', { name: 'ann@example.com' })).toHaveAttribute('href', '/account')
  })
})
