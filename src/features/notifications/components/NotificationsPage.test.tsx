import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { NotificationsPage } from './NotificationsPage'

const authState = vi.hoisted(() => ({
  user: { id: 'user_1' },
}))

const notificationsState = vi.hoisted(() => ({
  data: [] as Array<{
    id: string
    created_at: string
    organization_id: string
    user_id: string
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    body: string
    read: boolean
    action_url: string | null
    metadata: Record<string, unknown>
  }>,
  isLoading: false,
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  markAllPending: false,
}))

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: authState.user }),
}))

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({
    data: notificationsState.data,
    isLoading: notificationsState.isLoading,
  }),
  useMarkNotificationRead: () => ({ mutate: notificationsState.markRead }),
  useMarkAllRead: () => ({ mutate: notificationsState.markAllRead, isPending: notificationsState.markAllPending }),
}))

vi.mock('@/shared/utils/format', () => ({
  formatRelativeTime: () => '5 minutes ago',
}))

describe('NotificationsPage', () => {
  it('shows the loading skeleton while data is loading', () => {
    notificationsState.data = []
    notificationsState.isLoading = true

    const { container } = render(<NotificationsPage />)

    expect(screen.queryByText('Notifications')).toBeTruthy()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders unread notifications and allows marking them read', () => {
    notificationsState.data = [
      {
        id: 'n1',
        created_at: '2025-01-15T10:00:00Z',
        organization_id: 'org_1',
        user_id: 'user_1',
        type: 'info',
        title: 'New report ready',
        body: 'Your weekly report is ready.',
        read: false,
        action_url: null,
        metadata: {},
      },
      {
        id: 'n2',
        created_at: '2025-01-15T09:00:00Z',
        organization_id: 'org_1',
        user_id: 'user_1',
        type: 'success',
        title: 'Sync completed',
        body: 'All sources are up to date.',
        read: true,
        action_url: null,
        metadata: {},
      },
    ]
    notificationsState.isLoading = false
    notificationsState.markRead.mockClear()
    notificationsState.markAllRead.mockClear()

    render(<NotificationsPage />)

    expect(screen.getByText('1 unread')).toBeTruthy()
    expect(screen.getByText('New report ready')).toBeTruthy()
    expect(screen.getByText('Sync completed')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Mark "New report ready" as read' }))
    expect(notificationsState.markRead).toHaveBeenCalledWith('n1')

    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }))
    expect(notificationsState.markAllRead).toHaveBeenCalledTimes(1)
  })

  it('renders the empty state when there are no notifications', () => {
    notificationsState.data = []
    notificationsState.isLoading = false

    render(<NotificationsPage />)

    expect(screen.getByText('All caught up')).toBeTruthy()
    expect(screen.getByText('No notifications yet')).toBeTruthy()
  })
})