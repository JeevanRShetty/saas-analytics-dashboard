import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/shared/lib/queryClient'

const useQueryMock = vi.fn((config: unknown) => ({ config }))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()

  return {
    ...actual,
    useQuery: (config: unknown) => useQueryMock(config),
  }
})

describe('useAuditLogs', () => {
  it('builds the paginated audit log query key', async () => {
    const { useAuditLogs } = await import('./useAuditLogs')
    const { result } = renderHook(() =>
      useAuditLogs('123e4567-e89b-12d3-a456-426614174000', 2, 15, {
        actorEmail: 'alex@example.com',
        action: 'user_created',
      }),
    )

    expect(result.current.config.queryKey).toEqual(
      queryKeys.auditLogs.list('123e4567-e89b-12d3-a456-426614174000', 2, {
        actorEmail: 'alex@example.com',
        action: 'user_created',
      }),
    )
    expect(result.current.config.enabled).toBe(true)
    expect(result.current.config.staleTime).toBe(1000 * 60)
    expect(typeof result.current.config.placeholderData).toBe('function')
  })

  it('disables query execution when organization id is missing', async () => {
    const { useAuditLogs } = await import('./useAuditLogs')
    const { result } = renderHook(() => useAuditLogs('', 0, 15, {}))

    expect(result.current.config.enabled).toBe(false)
  })
})