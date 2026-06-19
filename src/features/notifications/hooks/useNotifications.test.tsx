import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { queryKeys } from '@/shared/lib/queryClient'
import type { Notification } from '@/shared/types/database.types'

const useQueryMock = vi.fn((config: unknown) => ({ config }))
const useMutationMock = vi.fn((config: unknown) => ({ config }))
const queryClientState = vi.hoisted(() => ({
  setQueryData: vi.fn(),
  getQueryData: vi.fn(),
  cancelQueries: vi.fn(),
  invalidateQueries: vi.fn(),
}))

const supabaseState = vi.hoisted(() => ({
  onInsert: null as null | ((payload: { new: Notification }) => void),
  onUpdate: null as null | ((payload: { new: Notification }) => void),
  subscribeStatusCallback: null as null | ((status: string) => void),
  removeChannel: vi.fn(),
  channel: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()

  return {
    ...actual,
    useQuery: (config: unknown) => useQueryMock(config),
    useMutation: (config: unknown) => useMutationMock(config),
    useQueryClient: () => queryClientState,
  }
})

vi.mock('@/shared/lib/supabaseClient', () => ({
  supabase: {
    channel: (name: string) => {
      const chain = {
        on: (_event: string, opts: { event: string }, callback: (payload: { new: Notification }) => void) => {
          if (opts.event === 'INSERT') supabaseState.onInsert = callback
          if (opts.event === 'UPDATE') supabaseState.onUpdate = callback
          return chain
        },
        subscribe: (callback: (status: string) => void) => {
          supabaseState.subscribeStatusCallback = callback
          return chain
        },
      }

      return chain
    },
    removeChannel: supabaseState.removeChannel,
  },
}))

describe('useNotifications', () => {
  beforeEach(() => {
    useQueryMock.mockClear()
    useMutationMock.mockClear()
    queryClientState.setQueryData.mockClear()
    queryClientState.getQueryData.mockClear()
    queryClientState.cancelQueries.mockClear()
    queryClientState.invalidateQueries.mockClear()
    supabaseState.onInsert = null
    supabaseState.onUpdate = null
    supabaseState.subscribeStatusCallback = null
    supabaseState.removeChannel.mockClear()
  })

  it('subscribes to realtime inserts and updates the cache', async () => {
    queryClientState.getQueryData.mockReturnValue([
      {
        id: 'n1',
        created_at: '2025-01-15T00:00:00Z',
        organization_id: 'org_1',
        user_id: 'user_1',
        type: 'info',
        title: 'Existing',
        body: 'Existing body',
        read: false,
        action_url: null,
        metadata: {},
      },
    ])

    const { useNotifications } = await import('./useNotifications')
    renderHook(() => useNotifications('user_1'))

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: queryKeys.notifications.list('user_1'),
        enabled: true,
      }),
    )

    supabaseState.subscribeStatusCallback?.('SUBSCRIBED')
    expect(queryClientState.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.list('user_1'),
    })

    act(() => {
      supabaseState.onInsert?.({
        new: {
          id: 'n2',
          created_at: '2025-01-16T00:00:00Z',
          organization_id: 'org_1',
          user_id: 'user_1',
          type: 'success',
          title: 'New notification',
          body: 'Hello',
          read: false,
          action_url: null,
          metadata: {},
        },
      })
    })

    expect(queryClientState.setQueryData).toHaveBeenCalledWith(
      queryKeys.notifications.list('user_1'),
      expect.any(Function),
    )
    expect(queryClientState.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.unreadCount('user_1'),
    })
  })

  it('removes the realtime subscription on cleanup', async () => {
    const { useNotifications } = await import('./useNotifications')
    const { unmount } = renderHook(() => useNotifications('user_1'))

    unmount()
    expect(supabaseState.removeChannel).toHaveBeenCalled()
  })
})