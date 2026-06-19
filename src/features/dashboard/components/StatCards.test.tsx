import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { StatCards } from './StatCards'

const analyticsState = vi.hoisted(() => ({
  cards: [] as Array<{
    label: string
    value: string
    delta: number
    trend: 'up' | 'down' | 'neutral'
  }>,
  isLoading: false,
}))

vi.mock('@/features/analytics/hooks/useAnalytics', () => ({
  useStatCards: () => ({
    cards: analyticsState.cards,
    isLoading: analyticsState.isLoading,
  }),
}))

describe('StatCards', () => {
  it('renders skeleton cards while loading with no cached data', () => {
    analyticsState.cards = []
    analyticsState.isLoading = true

    const { container } = render(<StatCards organizationId="org_123" />)

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(screen.queryByText('Total events')).toBeNull()
  })

  it('renders the provided stat cards and refresh state', () => {
    analyticsState.cards = [
      { label: 'Total events', value: '1,234', delta: 0.12, trend: 'up' },
      { label: 'Unique sessions', value: '456', delta: -0.03, trend: 'down' },
    ]
    analyticsState.isLoading = true

    const { container } = render(<StatCards organizationId="org_123" />)

    expect(screen.getByText('Total events')).toBeTruthy()
    expect(screen.getByText('1,234')).toBeTruthy()
    expect(screen.getByText('+12.0% vs last period')).toBeTruthy()
    expect(screen.getByText('-3.0% vs last period')).toBeTruthy()
    expect(container.querySelector('.opacity-60')).not.toBeNull()
  })
})