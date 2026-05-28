/**
 * useAnalytics.ts
 *
 * React Query hooks for analytics data.
 *
 * The separation between hook and API function matters:
 *   - The API function is a pure async function (easy to test)
 *   - The hook adds React Query semantics: caching, loading state, error state
 *   - Components use the hook, tests can test the API function directly
 */

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { getAnalyticsSummary, getAnalyticsEvents } from '../api/analytics.api'
import { useFiltersStore } from '@/store/filtersStore'
import type { AnalyticsEventsFilter } from '../api/analytics.api'

// ─── Summary hook ─────────────────────────────────────────────────────────────

export function useAnalyticsSummary(organizationId: string) {
  const dateRange = useFiltersStore((s) => s.dateRange)

  return useQuery({
    queryKey: queryKeys.analytics.summary(
      organizationId,
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ),
    queryFn: () => getAnalyticsSummary(organizationId, dateRange).then((r) => {
      if (r.error) throw new Error(r.error.message)
      return r.data
    }),
    // Analytics summaries can be slightly stale — 5-minute default is fine
    staleTime: 1000 * 60 * 5,
    // Placeholder data keeps the UI from showing empty state on tab switch
    placeholderData: (prev) => prev,
  })
}

// ─── Events hook ──────────────────────────────────────────────────────────────

export function useAnalyticsEvents(
  organizationId: string,
  page: number,
  pageSize: number,
  filters: AnalyticsEventsFilter,
) {
  return useQuery({
    queryKey: queryKeys.analytics.events(organizationId, page, filters),
    queryFn: () =>
      getAnalyticsEvents(organizationId, page, pageSize, filters).then((r) => {
        if (r.error) throw new Error(r.error.message)
        return r.data
      }),
    // Keep previous page data while fetching next page (no empty flash)
    placeholderData: (prev) => prev,
  })
}

// ─── Stat cards derived from summary ─────────────────────────────────────────

export interface StatCard {
  label: string
  value: string
  delta: number
  trend: 'up' | 'down' | 'neutral'
}

export function useStatCards(organizationId: string): {
  cards: StatCard[]
  isLoading: boolean
  isError: boolean
} {
  const { data, isLoading, isError } = useAnalyticsSummary(organizationId)

  if (!data) {
    return {
      cards: [],
      isLoading,
      isError,
    }
  }

  // In a real app, delta would compare to the previous period.
  // We'd pass both current and previous period summaries from the API.
  const cards: StatCard[] = [
    {
      label: 'Total events',
      value: data.totalEvents.toLocaleString(),
      delta: 0.12,
      trend: 'up',
    },
    {
      label: 'Unique sessions',
      value: data.uniqueSessions.toLocaleString(),
      delta: 0.08,
      trend: 'up',
    },
    {
      label: 'Unique users',
      value: data.uniqueUsers.toLocaleString(),
      delta: -0.03,
      trend: 'down',
    },
    {
      label: 'Avg. session events',
      value: data.uniqueSessions > 0
        ? (data.totalEvents / data.uniqueSessions).toFixed(1)
        : '0',
      delta: 0.05,
      trend: 'up',
    },
  ]

  return { cards, isLoading, isError }
}