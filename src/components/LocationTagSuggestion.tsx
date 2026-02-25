'use client'

import { useState } from 'react'

interface LocationTagSuggestionProps {
  suggestion?: string
  onAccept: (tag: string) => void
  onReject: () => void
}

export function LocationTagSuggestion({ suggestion, onAccept, onReject }: LocationTagSuggestionProps) {
  const [edited, setEdited] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  if (!suggestion || suggestion.trim().length === 0) {
    return null
  }

  const normalizedSuggestion = suggestion.toLowerCase().trim()

  const handleAccept = () => {
    onAccept(edited || normalizedSuggestion)
  }

  const handleEdit = () => {
    setEdited(normalizedSuggestion)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    onAccept(edited.toLowerCase().trim())
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
        <p className="text-sm text-green-800 font-medium mb-2">Edit location tag:</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={edited}
            onChange={(e) => setEdited(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="button"
            onClick={handleSaveEdit}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm text-green-800 font-medium">Detected location:</p>
          <p className="text-sm text-green-700 mt-1">{normalizedSuggestion}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAccept}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add tag
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onReject}
            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Ignore
          </button>
        </div>
      </div>
    </div>
  )
}
