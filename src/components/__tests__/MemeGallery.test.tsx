import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemeGallery } from '@/components/MemeGallery'

describe('MemeGallery', () => {
  const mockMemes = [
    {
      id: '1',
      imageUrl: 'https://example.com/1.jpg',
      description: 'Test meme 1',
      category: 'funny',
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      imageUrl: 'https://example.com/2.jpg',
      description: 'Test meme 2',
      category: 'translation',
      tags: ['chinese'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render memes in grid', async () => {
    ;(global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMemes),
      } as Response)
    )
    
    render(<MemeGallery initialMemes={mockMemes} />)
    
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
  })

  it('should show empty state when no memes', async () => {
    render(<MemeGallery initialMemes={[]} />)
    
    await waitFor(() => {
      expect(screen.getByText(/no memes found/i)).toBeInTheDocument()
    })
  })

  it('shows the thumbnail when a meme has one, and the original otherwise', () => {
    const withThumb = { ...mockMemes[0], thumbnailUrl: 'https://example.com/thumbs/480/1.webp' }
    render(<MemeGallery initialMemes={[withThumb, mockMemes[1]]} />)
    const [first, second] = screen.getAllByRole('img').map((img) => img.getAttribute('src') ?? '')
    expect(first).toBe('https://example.com/thumbs/480/1.webp')
    expect(decodeURIComponent(second)).toContain('https://example.com/2.jpg')
  })
})
