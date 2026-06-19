import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { queryKeys } from '@/shared/lib/queryClient'
import type { AiInsight } from '@/shared/types/database.types'

const useQueryMock = vi.fn((config: unknown) => ({ config }))

const supabaseState = vi.hoisted(() => ({
  updateResult: { error: null as null | { message: string } },
  update: vi.fn(),
  eq: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()

  return {
    ...actual,
    useQuery: (config: unknown) => useQueryMock(config),
  }
})

vi.mock('@/shared/lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      update: (...args: unknown[]) => {
        supabaseState.update(...args)
        return {
          eq: (...eqArgs: unknown[]) => {
            supabaseState.eq(...eqArgs)
            return Promise.resolve(supabaseState.updateResult)
          },
        }
      },
    }),
  },
}))

describe('useInsights', () => {
  beforeEach(() => {
    useQueryMock.mockClear()
    supabaseState.update.mockClear()
    supabaseState.eq.mockClear()
    supabaseState.updateResult = { error: null }
  })

  it('builds the insights query key', async () => {
    const { useInsights } = await import('./useInsights')
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useInsights('123e4567-e89b-12d3-a456-426614174000'), {
      wrapper,
    })

    expect(result.current.config.queryKey).toEqual(
      queryKeys.insights.list('123e4567-e89b-12d3-a456-426614174000'),
    )
    expect(result.current.config.enabled).toBe(true)
    expect(result.current.config.staleTime).toBe(1000 * 60 * 15)
  })

  it('optimistically acknowledges an insight and rolls back on failure', async () => {
    const { useAcknowledgeInsight } = await import('./useInsights')
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const queryKey = queryKeys.insights.list('123e4567-e89b-12d3-a456-426614174000')

    client.setQueryData<AiInsight[]>(queryKey, [
      {
        id: 'insight_1',
        created_at: '2025-01-15T00:00:00Z',
        organization_id: 'org_1',
        type: 'trend',
        title: 'Traffic is up',
        content: 'Traffic increased.',
        severity: 'low',
        metric_key: null,
        data_snapshot: {},
        acknowledged: false,
      },
    ])

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useAcknowledgeInsight('123e4567-e89b-12d3-a456-426614174000'), {
      wrapper,
    })

    supabaseState.updateResult = { error: null }
    await act(async () => {
      await result.current.mutateAsync('insight_1')
    })

    expect(client.getQueryData<AiInsight[]>(queryKey)?.[0].acknowledged).toBe(true)

    supabaseState.updateResult = { error: { message: 'boom' } }
    client.setQueryData<AiInsight[]>(queryKey, [
      {
        id: 'insight_2',
        created_at: '2025-01-15T00:00:00Z',
        organization_id: 'org_1',
        type: 'trend',
        title: 'Traffic is down',
        content: 'Traffic decreased.',
        severity: 'low',
        metric_key: null,
        data_snapshot: {},
        acknowledged: false,
      },
    ])

    await expect(
      act(async () => {
        await result.current.mutateAsync('insight_2')
      }),
    ).rejects.toBeTruthy()

    expect(client.getQueryData<AiInsight[]>(queryKey)?.[0].acknowledged).toBe(false)
  })
})