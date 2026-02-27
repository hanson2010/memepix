'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  preloadedTags?: { name: string; count: number }[]
}

interface TagSuggestion {
  name: string
  normalizedName: string
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

export function TagInput({ value, onChange, preloadedTags }: TagInputProps) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (preloadedTags) {
      setSuggestions(preloadedTags.map(t => ({
        name: t.name,
        normalizedName: normalizeTag(t.name),
        count: t.count,
      })))
    }
  }, [preloadedTags])

  useEffect(() => {
    if (input.length < 2) {
      if (preloadedTags) {
        setSuggestions(preloadedTags.map(t => ({
          name: t.name,
          normalizedName: normalizeTag(t.name),
          count: t.count,
        })).slice(0, 10))
      }
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/tags?q=${encodeURIComponent(input)}`)
        const data = await res.json()
        const tags = (data.tags || []).map((t: { name: string; count: number }) => ({
          name: t.name,
          normalizedName: normalizeTag(t.name),
          count: t.count,
        }))
        setSuggestions(tags)
      } catch (error) {
        console.error('Failed to search tags:', error)
      } finally {
        setLoading(false)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [input, preloadedTags])

  const filteredSuggestions = useMemo(() => {
    if (input.length < 2) return suggestions.slice(0, 10)
    const normalized = normalizeTag(input)
    return suggestions
      .filter((t) => t.normalizedName.includes(normalized))
      .slice(0, 10)
  }, [input, suggestions])

  const shouldShowDropdown = input.length >= 2 && filteredSuggestions.length > 0
  const safeSelectedIndex = Math.min(selectedIndex, filteredSuggestions.length - 1)

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
      if (shouldShowDropdown && filteredSuggestions.length > 0) {
        addTag(filteredSuggestions[safeSelectedIndex].name)
      } else {
        addTag(input)
      }
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    } else if (e.key === 'ArrowDown' && shouldShowDropdown) {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filteredSuggestions.length - 1))
    } else if (e.key === 'ArrowUp' && shouldShowDropdown) {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }, [input, value, addTag, removeTag, shouldShowDropdown, filteredSuggestions, safeSelectedIndex])

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

        {showDropdown && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
            {filteredSuggestions.map((suggestion, index) => (
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
