import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AnalyticsPage } from './AnalyticsPage'

const authState = vi.hoisted(() => ({
  profile: { organization_id: '123e4567-e89b-12d3-a456-426614174000' },
}))

const analyticsState = vi.hoisted(() => ({
  summary: {
    deviceBreakdown: [
      { device: 'desktop', count: 12, percentage: 60 },
      { device: 'mobile', count: 8, percentage: 40 },
    ],
    topPages: [
      { page: '/home', views: 20 },
      { page: '/dashboard', views: 15 },
    ],
    timeSeriesData: [],
  },
  summaryLoading: false,
  events: {
    data: {
      data: [
        {
          id: 'event_1',
          created_at: '2025-01-15T10:00:00Z',
          organization_id: 'org_1',
          event_type: 'page_view',
          user_id: 'user_1',
          session_id: 'session_1',
          properties: {},
          page_url: '/home',
          referrer: null,
          country: 'US',
          device_type: 'desktop',
        },
      ],
      total: 1,
      page: 0,
      pageSize: 10,
      hasNextPage: false,
    },
    isLoading: false,
    isFetching: false,
  },
}))

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ profile: authState.profile }),
}))

vi.mock('../../analytics/hooks/useAnalytics', () => ({
  useAnalyticsSummary: () => ({
    data: analyticsState.summary,
    isLoading: analyticsState.summaryLoading,
  }),
  useAnalyticsEvents: () => ({
    data: analyticsState.events.data,
    isLoading: analyticsState.events.isLoading,
    isFetching: analyticsState.events.isFetching,
  }),
}))

vi.mock('@/features/dashboard/components/FilterBar', () => ({
  FilterBar: () => <div data-testid="filter-bar" />,
}))

vi.mock('@/shared/components/ui/Skeleton', () => ({
  TableSkeleton: () => <div data-testid="table-skeleton" />,
  ChartSkeleton: () => <div data-testid="chart-skeleton" />,
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}))

describe('AnalyticsPage', () => {
  it('renders analytics summary and table data', () => {
    render(<AnalyticsPage />)

    expect(screen.getByText('Analytics')).toBeTruthy()
    expect(screen.getByTestId('filter-bar')).toBeTruthy()
    expect(screen.getByText('Device breakdown')).toBeTruthy()
    expect(screen.getByText('Top pages')).toBeTruthy()
    expect(screen.getByText('60.0%')).toBeTruthy()
    expect(screen.getByText('/home')).toBeTruthy()
    expect(screen.getByText('page_view')).toBeTruthy()
  })

  it('shows loading states when summary or table data are loading', () => {
    analyticsState.summaryLoading = true
    analyticsState.events.isLoading = true

    render(<AnalyticsPage />)

    expect(screen.getAllByTestId('chart-skeleton').length).toBeGreaterThan(0)
    expect(screen.getByTestId('table-skeleton')).toBeTruthy()
  })
})