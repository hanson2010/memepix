'use client'

import { useState, useCallback } from 'react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
}

export function TagInput({ value, onChange, suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState('')

  const addTag = useCallback((tag: string) => {
    const normalized = tag.toLowerCase().trim()
    if (normalized && !value.includes(normalized)) {
      onChange([...value, normalized])
    }
    setInput('')
  }, [value, onChange])

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }, [value, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }, [input, value, addTag, removeTag])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-blue-600"
              aria-label={`Remove ${tag}`}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a tag and press Enter"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {input && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {suggestions
              .filter((s) => s.toLowerCase().includes(input.toLowerCase()))
              .slice(0, 5)
              .map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addTag(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100"
                >
                  {suggestion}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
