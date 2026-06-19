import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RecentActivity } from './RecentActivity'

const queryState = vi.hoisted(() => ({
  data: null as null | Array<{
    id: string
    created_at: string
    actor_email: string
    action: string
    resource_type: string
  }>,
  isLoading: false,
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()

  return {
    ...actual,
    useQuery: () => ({
      data: queryState.data,
      isLoading: queryState.isLoading,
    }),
  }
})

vi.mock('@/shared/utils/format', () => ({
  formatRelativeTime: () => '2 hours ago',
  slugToTitle: (value: string) => value.replace(/_/g, ' '),
}))

describe('RecentActivity', () => {
  it('shows a loading skeleton while fetching', () => {
    queryState.data = null
    queryState.isLoading = true

    const { container } = render(<RecentActivity organizationId="org_123" />)

    expect(screen.queryByText('Recent activity')).toBeNull()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders an empty state when there are no logs', () => {
    queryState.data = []
    queryState.isLoading = false

    render(<RecentActivity organizationId="org_123" />)

    expect(screen.getByText('Recent activity')).toBeTruthy()
    expect(screen.getByText('No recent activity')).toBeTruthy()
  })

  it('renders activity items from the query data', () => {
    queryState.data = [
      {
        id: 'log_1',
        created_at: '2025-01-15T10:00:00Z',
        actor_email: 'alex@example.com',
        action: 'user_created',
        resource_type: 'team_member',
      },
    ]
    queryState.isLoading = false

    render(<RecentActivity organizationId="org_123" />)

    expect(screen.getByText('alex@example.com')).toBeTruthy()
    expect(screen.getByText('user created')).toBeTruthy()
    expect(screen.getByText('team member')).toBeTruthy()
    expect(screen.getByText('2 hours ago')).toBeTruthy()
  })
})