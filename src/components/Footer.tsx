export function Footer() {
  return (
    <footer className="bg-gray-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Hanson Hu. All rights reserved.
        </p>
        <p className="text-center text-xs text-gray-400 mt-1">
          Uploaded content is shared under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">CC BY 4.0</a> license.
        </p>
      </div>
    </footer>
  )
}
