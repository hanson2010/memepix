'use client'

import { useState } from 'react'

interface DescriptionInputProps {
  value: string
  onChange: (value: string) => void
  suggestion?: string
}

export function DescriptionInput({ value, onChange, suggestion }: DescriptionInputProps) {
  const [showSuggestion, setShowSuggestion] = useState(true)
  const hasSuggestion = suggestion && suggestion.trim().length > 0

  const acceptSuggestion = () => {
    onChange(suggestion || '')
    setShowSuggestion(false)
  }

  const rejectSuggestion = () => {
    setShowSuggestion(false)
  }

  return (
    <div className="space-y-2">
      {hasSuggestion && showSuggestion && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">AI Suggestion:</p>
              <p className="text-sm text-blue-700 mt-1">{suggestion}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={acceptSuggestion}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={rejectSuggestion}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe the meme..."
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
    </div>
  )
}
