/**
 * router.tsx
 *
 * Central route configuration. All routes defined in one place.
 *
 * Key patterns:
 *
 * LAZY LOADING
 *   Every page component is wrapped in React.lazy(). This means:
 *   - The initial JS bundle contains only the auth flow
 *   - Each feature chunk is fetched on first navigation to that route
 *   - Users who only use 3 of 10 features never download the other 7
 *
 *   The Suspense boundary wrapping each lazy route shows a skeleton
 *   while the chunk downloads. On fast connections this is invisible.
 *   On slow connections it prevents a blank screen.
 *
 * ROUTE HIERARCHY
 *   / (root)
 *   ├── AuthLayout (GuestGuard — redirects authed users away)
 *   │   ├── /login
 *   │   ├── /signup
 *   │   └── /forgot-password
 *   └── AppLayout (AuthGuard — redirects unauthed users to login)
 *       ├── /dashboard (index — overview)
 *       ├── /dashboard/analytics
 *       ├── /dashboard/insights
 *       ├── /dashboard/notifications
 *       ├── /dashboard/audit-logs (admin+)
 *       ├── /dashboard/team (admin+)
 *       ├── /dashboard/organization (owner)
 *       └── /dashboard/settings
 *
 * ONBOARDING REDIRECT
 *   After login, useAuth checks if onboarding_completed is false.
 *   If so, the dashboard redirects to /onboarding before rendering.
 *   Onboarding is a separate layout — full-screen, no sidebar.
 */

import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AuthGuard, GuestGuard } from '@/features/auth/components/AuthGuard'
import { RouteErrorBoundary } from '@/shared/components/ui/ErrorBoundary'
import { AppShellSkeleton } from '@/layouts/AppShellSkeleton'

// ─── Lazy page imports ────────────────────────────────────────────────────────

const LoginPage = lazy(() =>
  import('@/features/auth/components/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const SignupPage = lazy(() =>
  import('@/features/auth/components/SignupPage').then((m) => ({ default: m.SignupPage })),
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/components/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const AnalyticsPage = lazy(() =>
  import('@/features/dashboard/components/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
)
const InsightsPage = lazy(() =>
  import('@/features/dashboard/components/InsightsPage').then((m) => ({ default: m.InsightsPage })),
)
const NotificationsPage = lazy(() =>
  import('@/features/notifications/components/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
)
const AuditLogsPage = lazy(() =>
  import('@/features/audit-logs/components/AuditLogsPage').then((m) => ({
    default: m.AuditLogsPage,
  })),
)
const OnboardingPage = lazy(() =>
  import('@/features/onboarding/components/OnboardingPage').then((m) => ({
    default: m.OnboardingPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('@/features/auth/components/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

// ─── Suspense wrapper ─────────────────────────────────────────────────────────

function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShellSkeleton minimal />}>
      {children}
    </Suspense>
  )
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  {
    // Guest-only routes (redirects authed users to dashboard)
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <PageSuspense><LoginPage /></PageSuspense>,
          },
          {
            path: '/signup',
            element: <PageSuspense><SignupPage /></PageSuspense>,
          },
        ],
      },
    ],
  },
  {
    // Onboarding — authenticated but no sidebar/shell
    path: '/onboarding',
    element: <AuthGuard />,
    children: [
      {
        index: true,
        element: <PageSuspense><OnboardingPage /></PageSuspense>,
      },
    ],
  },
  {
    // Protected app routes
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            path: '/',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/dashboard',
            element: (
              <RouteErrorBoundary>
                <PageSuspense><DashboardPage /></PageSuspense>
              </RouteErrorBoundary>
            ),
          },
          {
            path: '/dashboard/analytics',
            element: (
              <RouteErrorBoundary>
                <PageSuspense><AnalyticsPage /></PageSuspense>
              </RouteErrorBoundary>
            ),
          },
          {
            path: '/dashboard/insights',
            element: (
              <RouteErrorBoundary>
                <PageSuspense><InsightsPage /></PageSuspense>
              </RouteErrorBoundary>
            ),
          },
          {
            path: '/dashboard/notifications',
            element: (
              <RouteErrorBoundary>
                <PageSuspense><NotificationsPage /></PageSuspense>
              </RouteErrorBoundary>
            ),
          },
          {
            // Admin-only — AuthGuard handles redirect if role insufficient
            path: '/dashboard/audit-logs',
            element: <AuthGuard requiredRole="admin" />,
            children: [
              {
                index: true,
                element: (
                  <RouteErrorBoundary>
                    <PageSuspense><AuditLogsPage /></PageSuspense>
                  </RouteErrorBoundary>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/403',
    element: (
      <div className="flex min-h-screen items-start justify-center px-4 py-8 sm:items-center sm:py-0">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50">403</h1>
          <p className="mt-2 text-gray-500">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    ),
  },
  {
    path: '*',
    element: <PageSuspense><NotFoundPage /></PageSuspense>,
  },
])