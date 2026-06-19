import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { DashboardPage } from './DashboardPage'

const authState = vi.hoisted(() => ({
  profile: null as null | { organization_id: string },
}))

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ profile: authState.profile }),
}))

vi.mock('./StatCards.tsx', () => ({
  StatCards: ({ organizationId }: { organizationId: string }) => (
    <div data-testid="stat-cards">{organizationId}</div>
  ),
}))

vi.mock('@/features/dashboard/components/EventsChart', () => ({
  EventsChart: ({ organizationId }: { organizationId: string }) => (
    <div data-testid="events-chart">{organizationId}</div>
  ),
}))

vi.mock('./InsightsPanel.tsx', () => ({
  InsightsPanel: ({ organizationId, compact }: { organizationId: string; compact?: boolean }) => (
    <div data-testid="insights-panel">{`${organizationId}|${String(Boolean(compact))}`}</div>
  ),
}))

vi.mock('./RecentActivity.tsx', () => ({
  RecentActivity: ({ organizationId }: { organizationId: string }) => (
    <div data-testid="recent-activity">{organizationId}</div>
  ),
}))

vi.mock('./FilterBar.tsx', () => ({
  FilterBar: () => <div data-testid="filter-bar" />,
}))

vi.mock('@/shared/components/ui/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

describe('DashboardPage', () => {
  it('shows a loading message when the profile is not available', () => {
    authState.profile = null

    render(<DashboardPage />)

    expect(screen.getByText('Loading your workspace...')).toBeTruthy()
    expect(screen.getByTestId('stat-cards').textContent).toBe('')
    expect(screen.getByTestId('events-chart').textContent).toBe('')
    expect(screen.getByTestId('insights-panel').textContent).toBe('|true')
    expect(screen.getByTestId('recent-activity').textContent).toBe('')
  })

  it('passes the organization id to dashboard sections', () => {
    authState.profile = { organization_id: 'org_123' }

    render(<DashboardPage />)

    expect(screen.getByText('Analytics overview for your organization')).toBeTruthy()
    expect(screen.getByTestId('stat-cards').textContent).toBe('org_123')
    expect(screen.getByTestId('events-chart').textContent).toBe('org_123')
    expect(screen.getByTestId('insights-panel').textContent).toBe('org_123|true')
    expect(screen.getByTestId('recent-activity').textContent).toBe('org_123')
    expect(screen.getByTestId('filter-bar')).toBeTruthy()
  })
})