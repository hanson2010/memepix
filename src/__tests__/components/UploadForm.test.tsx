import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { UploadForm } from '@/components/UploadForm'

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
global.fetch = mockFetch

describe('UploadForm', () => {
  const mockOnUploadComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ uploadUrl: 'https://test.url', imageUrl: 'https://test.image' }),
    } as Response)
  })

  it('should render upload area', () => {
    render(<UploadForm onUploadComplete={mockOnUploadComplete} />)
    
    expect(screen.getByText(/tap to select or drag and drop/i)).toBeInTheDocument()
  })

  it('should show supported formats', () => {
    render(<UploadForm onUploadComplete={mockOnUploadComplete} />)
    
    expect(screen.getByText(/JPEG, PNG, GIF, or WebP/i)).toBeInTheDocument()
  })
})
