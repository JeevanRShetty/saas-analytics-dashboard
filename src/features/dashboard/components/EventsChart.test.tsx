import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { EventsChart } from './EventsChart'

const analyticsState = vi.hoisted(() => ({
  data: null as null | {
    timeSeriesData: Array<{ date: string; events: number; sessions: number }>
  },
  isLoading: false,
}))

vi.mock('@/features/analytics/hooks/useAnalytics', () => ({
  useAnalyticsSummary: () => ({
    data: analyticsState.data,
    isLoading: analyticsState.isLoading,
  }),
}))

vi.mock('@/shared/utils/format', () => ({
  formatChartDate: (date: string) => `formatted:${date.slice(0, 10)}`,
  formatCompactNumber: (value: number) => `#${value}`,
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <>{children}</>,
  AreaChart: ({ data, children }: { data: Array<{ dateLabel: string }>; children: ReactNode }) => (
    <div>
      <pre data-testid="chart-data">{JSON.stringify(data)}</pre>
      {children}
    </div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}))

describe('EventsChart', () => {
  it('shows a skeleton while loading with no data', () => {
    analyticsState.data = null
    analyticsState.isLoading = true

    const { container } = render(<EventsChart organizationId="org_123" />)

    expect(screen.queryByText('Events over time')).toBeNull()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('formats chart data before passing it to the chart', () => {
    analyticsState.data = {
      timeSeriesData: [
        { date: '2025-01-15T00:00:00Z', events: 1234, sessions: 98 },
        { date: '2025-01-16T00:00:00Z', events: 2000, sessions: 150 },
      ],
    }
    analyticsState.isLoading = false

    render(<EventsChart organizationId="org_123" />)

    expect(screen.getByText('Events over time')).toBeTruthy()
    expect(screen.getByText('2 data points')).toBeTruthy()
    expect(screen.getByTestId('chart-data').textContent).toContain('formatted:2025-01-15')
    expect(screen.getByTestId('chart-data').textContent).toContain('formatted:2025-01-16')
  })
})