import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AuditLogsPage } from './AuditLogsPage'

const authState = vi.hoisted(() => ({
  profile: { organization_id: 'org_1' },
}))

const auditState = vi.hoisted(() => ({
  data: null as null | {
    data: Array<{
      id: string
      created_at: string
      organization_id: string
      actor_id: string
      actor_email: string
      action: string
      resource_type: string
      resource_id: string | null
      metadata: Record<string, unknown>
      ip_address: string | null
    }>
    total: number
    page: number
    pageSize: number
    hasNextPage: boolean
  },
  isLoading: false,
  isFetching: false,
  lastFilters: null as null | { actorEmail?: string },
  lastPage: 0,
}))

const toastState = vi.hoisted(() => ({
  success: vi.fn(),
}))

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ profile: authState.profile }),
}))

vi.mock('../hooks/useAuditLogs', () => ({
  useAuditLogs: (_orgId: string, page: number, _pageSize: number, filters: { actorEmail?: string }) => {
    auditState.lastPage = page
    auditState.lastFilters = filters
    return {
      data: auditState.data,
      isLoading: auditState.isLoading,
      isFetching: auditState.isFetching,
    }
  },
}))

vi.mock('@/shared/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}))

vi.mock('@/shared/components/ui/Toast', () => ({
  useToast: () => ({ success: toastState.success }),
}))

describe('AuditLogsPage', () => {
  it('filters by actor email and copies metadata', async () => {
    auditState.data = {
      data: [
        {
          id: 'log_1',
          created_at: '2025-01-15T10:00:00Z',
          organization_id: 'org_1',
          actor_id: 'user_1',
          actor_email: 'alex@example.com',
          action: 'user_created',
          resource_type: 'team_member',
          resource_id: null,
          metadata: { foo: 'bar' },
          ip_address: '127.0.0.1',
        },
      ],
      total: 1,
      page: 0,
      pageSize: 15,
      hasNextPage: false,
    }
    auditState.isLoading = false
    auditState.isFetching = false
    auditState.lastFilters = null
    toastState.success.mockClear()
      Object.defineProperty(window.navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        configurable: true,
      })

    render(<AuditLogsPage />)

    expect(screen.getByText('alex@example.com')).toBeTruthy()
      expect(screen.getByText('Team Member')).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('Search by actor email...'), {
      target: { value: 'alex' },
    })

    expect(auditState.lastFilters).toEqual({ actorEmail: 'alex' })
    expect(auditState.lastPage).toBe(0)

    fireEvent.click(screen.getByLabelText('Copy event metadata'))
    expect(toastState.success).toHaveBeenCalledWith('Copied', 'Metadata copied to clipboard')
  })

  it('renders the loading skeleton when data is loading', () => {
    auditState.data = null
    auditState.isLoading = true
    auditState.isFetching = false

    const { container } = render(<AuditLogsPage />)

    expect(screen.getByText('Audit Logs')).toBeTruthy()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})