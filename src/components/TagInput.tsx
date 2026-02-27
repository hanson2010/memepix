'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
}

interface TagSuggestion {
  name: string
  count: number
}

function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [input, setInput] = useState('')
  const [allTags, setAllTags] = useState<TagSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch('/api/tags')
        const data = await res.json()
        setAllTags(data.tags || [])
      } catch (error) {
        console.error('Failed to fetch tags:', error)
      }
    }
    fetchTags()
  }, [])

  const suggestions = useMemo(() => {
    if (input.length < 2) return []
    const normalized = normalizeTag(input)
    return allTags.filter((t) => normalizeTag(t.name).includes(normalized)).slice(0, 10)
  }, [input, allTags])

  const shouldShowDropdown = input.length >= 2 && suggestions.length > 0
  const safeSelectedIndex = Math.min(selectedIndex, suggestions.length - 1)

  const addTag = useCallback((tag: string) => {
    const normalized = normalizeTag(tag)
    if (normalized && !value.includes(normalized)) {
      onChange([...value, normalized])
    }
    setInput('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }, [value, onChange])

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }, [value, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (shouldShowDropdown && suggestions.length > 0) {
        addTag(suggestions[safeSelectedIndex].name)
      } else {
        addTag(input)
      }
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    } else if (e.key === 'ArrowDown' && shouldShowDropdown) {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp' && shouldShowDropdown) {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }, [input, value, addTag, removeTag, shouldShowDropdown, suggestions, safeSelectedIndex])

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-blue-600 p-1 min-h-[28px] min-w-[28px] flex items-center justify-center"
                aria-label={`Remove ${tag}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          onFocus={() => {
            if (shouldShowDropdown) {
              setShowDropdown(true)
            }
          }}
          placeholder="Type a tag and press Enter"
          className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.name}
                type="button"
                onClick={() => addTag(suggestion.name)}
                className={`w-full px-3 py-3 text-left min-h-[48px] flex justify-between items-center ${
                  index === safeSelectedIndex ? 'bg-blue-50' : 'hover:bg-gray-100'
                }`}
              >
                <span>{suggestion.name}</span>
                <span className="text-xs text-gray-400">{suggestion.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
