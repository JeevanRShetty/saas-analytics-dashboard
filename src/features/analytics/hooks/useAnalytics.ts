import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { getAnalyticsSummary, getAnalyticsEvents } from '../api/analytics.api'
import { useFiltersStore } from '@/store/filtersStore'
import type { AnalyticsEventsFilter } from '../api/analytics.api'

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

export function useAnalyticsSummary(organizationId: string) {
  const dateRange = useFiltersStore((s) => s.dateRange)

  return useQuery({
    queryKey: queryKeys.analytics.summary(
      organizationId,
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
    ),
    queryFn: () =>
      getAnalyticsSummary(organizationId, dateRange).then((r) => {
        if (r.error) throw new Error(r.error.message)
        return r.data
      }),
    enabled: isValidUUID(organizationId),
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  })
}

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
    enabled: isValidUUID(organizationId),
    placeholderData: (prev) => prev,
  })
}

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
    return { cards: [], isLoading, isError }
  }

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
      value:
        data.uniqueSessions > 0
          ? (data.totalEvents / data.uniqueSessions).toFixed(1)
          : '0',
      delta: 0.05,
      trend: 'up',
    },
  ]

  return { cards, isLoading, isError }
}
