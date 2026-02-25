'use client'

interface TagFilterProps {
  value: string[]
  onChange: (tags: string[]) => void
  availableTags?: string[]
}

export function TagFilter({ value, onChange, availableTags = [] }: TagFilterProps) {
  const toggleTag = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag))
    } else {
      onChange([...value, tag])
    }
  }

  if (availableTags.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableTags.map((tag) => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            value.includes(tag)
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
