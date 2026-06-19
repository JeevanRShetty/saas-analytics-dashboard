import { describe, expect, it, vi, beforeEach } from 'vitest'

const rpcMock = vi.fn()

const queryState = vi.hoisted(() => ({
  data: null as null | Array<Record<string, unknown>>,
  error: null as null | { message: string; code: string },
  count: 0,
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
  ilike: vi.fn(),
}))

vi.mock('@/shared/lib/supabaseClient', () => ({
  supabase: {
    rpc: rpcMock,
    from: () => {
      const query = {
        select: (...args: unknown[]) => {
          queryState.select(...args)
          return query
        },
        eq: (...args: unknown[]) => {
          queryState.eq(...args)
          return query
        },
        order: (...args: unknown[]) => {
          queryState.order(...args)
          return query
        },
        range: (...args: unknown[]) => {
          queryState.range(...args)
          return query
        },
        ilike: (...args: unknown[]) => {
          queryState.ilike(...args)
          return query
        },
        then: (resolve: (value: { data: unknown; error: unknown; count: number }) => void) =>
          Promise.resolve({ data: queryState.data, error: queryState.error, count: queryState.count }).then(resolve),
      }

      return query
    },
  },
}))

describe('analytics.api', () => {
  beforeEach(() => {
    rpcMock.mockReset()
    queryState.data = null
    queryState.error = null
    queryState.count = 0
    queryState.select.mockClear()
    queryState.eq.mockClear()
    queryState.order.mockClear()
    queryState.range.mockClear()
    queryState.ilike.mockClear()
  })

  it('transforms analytics summary RPC results', async () => {
    rpcMock.mockResolvedValue({
      data: {
        total_events: 42,
        unique_sessions: 10,
        unique_users: 5,
        top_pages: [{ page: '/home', views: 20 }],
        device_breakdown: [{ device: 'desktop', count: 30, percentage: 71.4 }],
        country_breakdown: [{ country: 'US', count: 18 }],
        time_series: [{ date: '2025-01-15', events: 10, sessions: 3 }],
      },
      error: null,
    })

    const { getAnalyticsSummary } = await import('./analytics.api')
    const result = await getAnalyticsSummary('org_123', {
      from: new Date('2025-01-01T00:00:00Z'),
      to: new Date('2025-01-31T00:00:00Z'),
    })

    expect(rpcMock).toHaveBeenCalledWith('get_analytics_summary', {
      org_id: 'org_123',
      start_date: '2025-01-01T00:00:00.000Z',
      end_date: '2025-01-31T00:00:00.000Z',
    })
    expect(result).toEqual({
      data: {
        totalEvents: 42,
        uniqueSessions: 10,
        uniqueUsers: 5,
        topPages: [{ page: '/home', views: 20 }],
        deviceBreakdown: [{ device: 'desktop', count: 30, percentage: 71.4 }],
        countryBreakdown: [{ country: 'US', count: 18 }],
        timeSeriesData: [{ date: '2025-01-15', events: 10, sessions: 3 }],
      },
      error: null,
    })
  })

  it('returns a normalized error when the summary RPC fails', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: 'boom', code: 'RPC_ERROR' },
    })

    const { getAnalyticsSummary } = await import('./analytics.api')
    const result = await getAnalyticsSummary('org_123', {
      from: new Date('2025-01-01T00:00:00Z'),
      to: new Date('2025-01-31T00:00:00Z'),
    })

    expect(result).toEqual({
      data: null,
      error: { message: 'boom', code: 'RPC_ERROR' },
    })
  })

  it('applies filters and paginates analytics events', async () => {
    queryState.data = [
      {
        id: 'event_1',
        created_at: '2025-01-15T10:00:00Z',
        organization_id: 'org_123',
        event_type: 'page_view',
        user_id: 'user_1',
        session_id: 'session_1',
        properties: {},
        page_url: '/dashboard',
        referrer: null,
        country: 'US',
        device_type: 'desktop',
      },
    ]
    queryState.count = 12

    const { getAnalyticsEvents } = await import('./analytics.api')
    const result = await getAnalyticsEvents('org_123', 1, 10, {
      eventType: 'page_view',
      deviceType: 'desktop',
      country: 'US',
      search: 'dash',
    })

    expect(queryState.select).toHaveBeenCalledWith('*', { count: 'exact' })
    expect(queryState.eq).toHaveBeenCalledWith('organization_id', 'org_123')
    expect(queryState.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(queryState.range).toHaveBeenCalledWith(10, 19)
    expect(queryState.eq).toHaveBeenCalledWith('event_type', 'page_view')
    expect(queryState.eq).toHaveBeenCalledWith('device_type', 'desktop')
    expect(queryState.eq).toHaveBeenCalledWith('country', 'US')
    expect(queryState.ilike).toHaveBeenCalledWith('page_url', '%dash%')
    expect(result).toEqual({
      data: {
        data: queryState.data,
        total: 12,
        page: 1,
        pageSize: 10,
        hasNextPage: false,
      },
      error: null,
    })
  })
})