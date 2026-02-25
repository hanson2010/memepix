'use client'

interface CategoryFilterProps {
  value: string
  onChange: (value: string) => void
}

const CATEGORIES = [
  { id: 'machine-translation-fails', name: 'Translation Fails' },
  { id: 'natural-landscape', name: 'Landscape' },
  { id: 'city-skyline', name: 'City Skyline' },
  { id: 'life-style', name: 'Life Style' },
  { id: 'others', name: 'Others' },
]

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange('')}
        className={`px-4 py-2 rounded-full text-sm transition-colors min-h-[44px] ${
          !value
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
        }`}
      >
        All
      </button>
      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(value === category.id ? '' : category.id)}
          className={`px-4 py-2 rounded-full text-sm transition-colors min-h-[44px] ${
            value === category.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
