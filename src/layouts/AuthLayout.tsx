/**
 * AuthLayout.tsx
 *
 * Minimal wrapper for unauthenticated pages (login, signup, forgot-password).
 * Keeps guest pages visually consistent without pulling in the full app shell.
 */

import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 dark:bg-gray-950 sm:px-0">
      <Outlet />
    </div>
  )
}