/**
 * DashboardPage.tsx
 *
 * The dashboard home — the first page users see after login.
 * Composed of independently-loading sections, each with its own
 * Suspense/error boundary so a failing chart doesn't kill the stats.
 *
 * Composition pattern:
 *   The page itself does no data fetching. It delegates to feature
 *   components (StatCards, EventsChart, InsightsPanel) which own
 *   their own data requirements. The page is just orchestration.
 *
 *   This "smart components fetch, dumb components render" pattern
 *   means the page is easy to rearrange without touching data logic.
 */

import { useAuth } from '@/features/auth/hooks/useAuth'
import { StatCards } from './StatCards.tsx'
import { EventsChart } from '@/features/dashboard/components/EventsChart'
import { InsightsPanel } from './InsightsPanel.tsx'
import { RecentActivity } from './RecentActivity.tsx'
import { FilterBar } from './FilterBar.tsx'
import { ErrorBoundary } from '@/shared/components/ui/ErrorBoundary'

export function DashboardPage() {
  const { profile } = useAuth()
  const orgId = profile?.organization_id ?? ''

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {profile?.organization_id
              ? `Analytics overview for your organization`
              : 'Loading your workspace...'}
          </p>
        </div>
        <FilterBar />
      </div>

      {/* Stat cards — 4 columns */}
      <ErrorBoundary>
        <StatCards organizationId={orgId} />
      </ErrorBoundary>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ErrorBoundary>
            <EventsChart organizationId={orgId} />
          </ErrorBoundary>
        </div>
        <div>
          <ErrorBoundary>
            <InsightsPanel organizationId={orgId} compact />
          </ErrorBoundary>
        </div>
      </div>

      {/* Recent activity */}
      <ErrorBoundary>
        <RecentActivity organizationId={orgId} />
      </ErrorBoundary>
    </div>
  )
}