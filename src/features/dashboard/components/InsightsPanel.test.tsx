import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { InsightsPanel } from './InsightsPanel'

const insightsState = vi.hoisted(() => ({
  data: [] as Array<{
    id: string
    created_at: string
    organization_id: string
    type: 'anomaly' | 'trend' | 'recommendation' | 'summary'
    title: string
    content: string
    severity: 'low' | 'medium' | 'high' | null
    acknowledged: boolean
  }>,
  isLoading: false,
  mutate: vi.fn(),
}))

vi.mock('../../analytics/hooks/useInsights', () => ({
  useInsights: () => ({
    data: insightsState.data,
    isLoading: insightsState.isLoading,
  }),
  useAcknowledgeInsight: () => ({
    mutate: insightsState.mutate,
  }),
}))

vi.mock('@/shared/utils/format', () => ({
  formatRelativeTime: () => 'just now',
}))

describe('InsightsPanel', () => {
  it('shows only unacknowledged compact insights and lets the user acknowledge them', () => {
    insightsState.data = [
      {
        id: 'insight-1',
        created_at: '2025-01-15T10:00:00Z',
        organization_id: 'org_123',
        type: 'trend',
        title: 'Traffic is up',
        content: 'Traffic increased this week.',
        severity: 'low',
        acknowledged: false,
      },
      {
        id: 'insight-2',
        created_at: '2025-01-15T11:00:00Z',
        organization_id: 'org_123',
        type: 'anomaly',
        title: 'Spike detected',
        content: 'Unusual spike in events.',
        severity: 'high',
        acknowledged: true,
      },
    ]
    insightsState.isLoading = false
    insightsState.mutate.mockClear()

    render(<InsightsPanel organizationId="org_123" compact />)

    expect(screen.getByText('Traffic is up')).toBeTruthy()
    expect(screen.queryByText('Spike detected')).toBeNull()
    expect(screen.queryByText('Traffic increased this week.')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Acknowledge insight: Traffic is up' }))

    expect(insightsState.mutate).toHaveBeenCalledWith('insight-1')
  })

  it('filters full insights by type', () => {
    insightsState.data = [
      {
        id: 'insight-1',
        created_at: '2025-01-15T10:00:00Z',
        organization_id: 'org_123',
        type: 'trend',
        title: 'Traffic is up',
        content: 'Traffic increased this week.',
        severity: 'low',
        acknowledged: false,
      },
      {
        id: 'insight-2',
        created_at: '2025-01-15T11:00:00Z',
        organization_id: 'org_123',
        type: 'anomaly',
        title: 'Spike detected',
        content: 'Unusual spike in events.',
        severity: 'high',
        acknowledged: false,
      },
    ]
    insightsState.isLoading = false

    render(<InsightsPanel organizationId="org_123" />)

    expect(screen.getByText('AI Insights')).toBeTruthy()
    expect(screen.getByText('Traffic is up')).toBeTruthy()
    expect(screen.getByText('Spike detected')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'anomaly' }))

    expect(screen.queryByText('Traffic is up')).toBeNull()
    expect(screen.getByText('Spike detected')).toBeTruthy()
  })
})