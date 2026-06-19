import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-4 py-8 dark:bg-gray-950 sm:items-center sm:py-0">
      <div className="max-w-sm text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">404</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-50">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500">The page you're looking for doesn't exist.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}