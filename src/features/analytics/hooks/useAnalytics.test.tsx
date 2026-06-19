import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/shared/lib/queryClient'
import type { DateRange } from '@/shared/types/app.types'

const useQueryMock = vi.fn((config: unknown) => ({ config }))
const filtersState = vi.hoisted(() => ({
  dateRange: {
    from: new Date('2025-01-01T00:00:00Z'),
    to: new Date('2025-01-31T00:00:00Z'),
  } as DateRange,
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()

  return {
    ...actual,
    useQuery: (config: unknown) => useQueryMock(config),
  }
})

vi.mock('@/store/filtersStore', () => ({
  useFiltersStore: (selector: (state: { dateRange: DateRange }) => unknown) =>
    selector({ dateRange: filtersState.dateRange }),
}))

describe('useAnalytics hooks', () => {
  it('builds a summary query with the selected date range', async () => {
    useQueryMock.mockClear()

    const { useAnalyticsSummary } = await import('./useAnalytics')
    const { result } = renderHook(() => useAnalyticsSummary('123e4567-e89b-12d3-a456-426614174000'))

    expect(result.current.config.queryKey).toEqual(
      queryKeys.analytics.summary(
        '123e4567-e89b-12d3-a456-426614174000',
        '2025-01-01T00:00:00.000Z',
        '2025-01-31T00:00:00.000Z',
      ),
    )
    expect(result.current.config.enabled).toBe(true)
    expect(result.current.config.staleTime).toBe(1000 * 60 * 5)
    expect(typeof result.current.config.placeholderData).toBe('function')
  })

  it('disables analytics queries for invalid ids and includes event filters in the key', async () => {
    useQueryMock.mockClear()

    const { useAnalyticsEvents } = await import('./useAnalytics')
    const { result } = renderHook(() =>
      useAnalyticsEvents('not-a-uuid', 2, 25, {
        eventType: 'page_view',
        deviceType: 'desktop',
        country: 'US',
        search: 'home',
      }),
    )

    expect(result.current.config.queryKey).toEqual(
      queryKeys.analytics.events('not-a-uuid', 2, {
        eventType: 'page_view',
        deviceType: 'desktop',
        country: 'US',
        search: 'home',
      }),
    )
    expect(result.current.config.enabled).toBe(false)
    expect(typeof result.current.config.placeholderData).toBe('function')
  })
})