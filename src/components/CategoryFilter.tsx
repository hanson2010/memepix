'use client'

interface CategoryFilterProps {
  value: string
  onChange: (value: string) => void
}

const CATEGORIES = [
  { id: 'machine-translation-fails', name: 'Machine Translation Fails' },
  { id: 'city-skyline', name: 'City Skyline' },
  { id: 'natural-landscape', name: 'Natural Landscape' },
  { id: 'life-style', name: 'Life Style' },
  { id: 'others', name: 'Others' },
]

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange('')}
        className={`px-3 py-1 rounded-full text-sm transition-colors ${
          !value
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(value === category.id ? '' : category.id)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            value === category.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
