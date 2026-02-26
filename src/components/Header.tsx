'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { AuthButton } from '@/components/AuthButton'

interface HeaderProps {
  activeTab?: 'browse' | 'tags' | 'upload'
}

export function Header({ activeTab = 'browse' }: HeaderProps) {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getBrowseClass = () => activeTab === 'browse' 
    ? 'bg-blue-600 text-white' 
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'

  const getTagsClass = () => activeTab === 'tags'
    ? 'bg-blue-600 text-white'
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'

  const getUploadClass = () => activeTab === 'upload'
    ? 'bg-blue-600 text-white'
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'

  return (
    <header className="bg-white shadow sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            <Link href="/">MemePix</Link>
          </h1>
          
          <div className="hidden sm:flex items-center gap-4">
            <nav className="flex gap-2">
              <Link
                href="/"
                className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg transition-colors min-h-[44px] text-sm ${getBrowseClass()}`}
              >
                Gallery
              </Link>
              <Link
                href="/tags"
                className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg transition-colors min-h-[44px] text-sm ${getTagsClass()}`}
              >
                Tags
              </Link>
              {session && (
                <Link
                  href="/#upload"
                  className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg transition-colors min-h-[44px] text-sm ${getUploadClass()}`}
                >
                  Upload
                </Link>
              )}
            </nav>
            <AuthButton />
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="sm:hidden pt-3 pb-2 border-t mt-3 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-colors text-left min-h-[48px] text-sm ${getBrowseClass()}`}
            >
              Gallery
            </Link>
            <Link
              href="/tags"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-colors text-left min-h-[48px] text-sm ${getTagsClass()}`}
            >
              Tags
            </Link>
            {session && (
              <Link
                href="/#upload"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-colors text-left min-h-[48px] text-sm ${getUploadClass()}`}
              >
                Upload
              </Link>
            )}
            <div className="pt-2">
              <AuthButton />
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
