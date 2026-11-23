import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const signIn = vi.fn()
vi.mock('next-auth/react', () => ({ signIn: (...args: unknown[]) => signIn(...args) }))

const { SignInOptions } = await import('@/components/SignInOptions')

describe('SignInOptions', () => {
  it('offers Google first, then GitHub', () => {
    render(<SignInOptions />)
    const buttons = screen.getAllByRole('button').map((b) => b.textContent)
    expect(buttons).toEqual(['Sign in with Google', 'Sign in with GitHub'])
  })

  it('starts sign-in with the chosen provider and destination', () => {
    render(<SignInOptions redirectTo="/upload" />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with GitHub' }))
    expect(signIn).toHaveBeenCalledWith('github', { redirectTo: '/upload' })
  })

  it('shows no error by default', () => {
    render(<SignInOptions />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('says sign-in did not complete when the provider returned an error', () => {
    render(<SignInOptions error="OAuthCallbackError" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Sign-in did not complete')
  })

  it('says sign-in was cancelled when access was denied', () => {
    render(<SignInOptions error="AccessDenied" />)
    expect(screen.getByRole('alert')).toHaveTextContent('cancelled or refused')
  })
})
