'use client'

interface CategorySelectProps {
  value: string
  onChange: (value: string) => void
}

const CATEGORIES = [
  { id: 'machine-translation-fails', name: 'Machine Translation Fails' },
  { id: 'natural-landscape', name: 'Natural Landscape' },
  { id: 'city-skyline', name: 'City Skyline' },
  { id: 'life-style', name: 'Life Style' },
  { id: 'others', name: 'Others' },
]

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select a category</option>
      {CATEGORIES.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  )
}
