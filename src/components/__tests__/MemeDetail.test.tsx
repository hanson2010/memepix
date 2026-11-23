import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemeDetail } from '@/components/MemeDetail'
import type { Meme } from '@/types'

const meme: Meme = {
  id: 'm1',
  imageUrl: 'https://example.com/1.jpg',
  description: 'A meme',
  category: 'others',
  tags: [],
  uploadedBy: 'ann@example.com',
  ownerId: 'acct1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

function editControls() {
  return [screen.queryByRole('button', { name: 'Edit' }), screen.queryByRole('button', { name: 'Delete' })]
}

describe('MemeDetail edit controls', () => {
  it('shows Edit and Delete to the owning account', () => {
    render(<MemeDetail meme={meme} onClose={() => {}} currentUserId="acct1" />)
    expect(editControls()).not.toContain(null)
  })

  it('hides them from another account', () => {
    render(<MemeDetail meme={meme} onClose={() => {}} currentUserId="acct2" />)
    expect(editControls()).toEqual([null, null])
  })

  it('hides them when signed out or the meme has no owner yet', () => {
    render(<MemeDetail meme={meme} onClose={() => {}} />)
    expect(editControls()).toEqual([null, null])
    render(<MemeDetail meme={{ ...meme, ownerId: undefined }} onClose={() => {}} currentUserId="acct1" />)
    expect(editControls()).toEqual([null, null])
  })
})

describe('MemeDetail dialog', () => {
  it('is a modal dialog that closes on Escape', () => {
    const onClose = vi.fn()
    render(<MemeDetail meme={meme} onClose={onClose} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('stops the page behind it from scrolling while open', () => {
    const { unmount } = render(<MemeDetail meme={meme} onClose={() => {}} />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('closes when clicking outside the dialog, not inside it', () => {
    const onClose = vi.fn()
    render(<MemeDetail meme={meme} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('dialog').parentElement!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
