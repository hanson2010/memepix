import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
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
    jest.clearAllMocks()
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render memes in grid', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
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
})
