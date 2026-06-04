/**
 * AuthGuard.tsx
 *
 * A route-level wrapper that enforces authentication and authorization.
 *
 * Usage:
 *   <Route element={<AuthGuard />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 *   <Route element={<AuthGuard requiredRole="admin" />}>
 *     <Route path="/settings/team" element={<TeamSettings />} />
 *   </Route>
 *
 * Three outcomes:
 *   1. Loading: show skeleton — we don't know yet if user is authed
 *   2. Not authenticated: redirect to /login, preserving the intended URL
 *   3. Authenticated (+ role check if provided): render children
 *
 * The "preserve intended URL" behavior is important UX:
 *   User visits /dashboard/analytics → gets redirected to /login
 *   User logs in → gets redirected to /dashboard/analytics (not home)
 *   We achieve this by passing the current location as state on the redirect.
 *
 * Role guard:
 *   If requiredRole is provided and the user lacks that role, we redirect
 *   to a 403 page rather than the login page — they're authenticated but
 *   not authorized. These are different failure modes that need different UX.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, usePermission } from '../hooks/useAuth'
import { AppShellSkeleton } from '@/layouts/AppShellSkeleton'
import type { UserRole } from '@/shared/types/database.types'

interface AuthGuardProps {
  requiredRole?: UserRole
}

export function AuthGuard({ requiredRole }: AuthGuardProps) {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()
  const hasRole = usePermission(requiredRole ?? 'viewer')

  // Case 1: We're still determining auth state
  // Show the full app shell skeleton so the layout doesn't flash
  if (isLoading) {
    return <AppShellSkeleton />
  }

  // Case 2: Not authenticated
  // Redirect to login, preserving where they wanted to go
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Case 3: Authenticated but missing required role
  if (requiredRole && !hasRole) {
    return <Navigate to="/403" replace />
  }

  // Case 4: Authorized — render the protected route
  return <Outlet />
}

/**
 * GuestGuard — inverse of AuthGuard.
 * Redirects authenticated users away from guest-only pages (login, signup).
 * If the user navigated from a protected page, send them back there.
 * Otherwise, send them to the dashboard.
 */
export function GuestGuard() {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <AppShellSkeleton minimal />
  }

  if (isAuthenticated) {
    const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/dashboard'
    return <Navigate to={from} replace />
  }

  return <Outlet />
}