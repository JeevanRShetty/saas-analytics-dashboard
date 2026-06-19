import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { queryKeys } from '@/shared/lib/queryClient'
import type { Profile } from '@/shared/types/database.types'

const sessionState = vi.hoisted(() => ({
  session: null as null | { user: { id: string; email?: string } },
  sessionLoading: false,
  profile: null as Profile | null,
  profileLoading: false,
}))

const queryClientState = vi.hoisted(() => ({
  setQueryData: vi.fn(),
  clear: vi.fn(),
  invalidateQueries: vi.fn(),
}))

let authStateChangeCallback: ((event: string, session: unknown) => void) | null = null

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()

  return {
    ...actual,
    useQuery: (config: { queryKey: unknown[] }) => {
      const isSession = Array.isArray(config.queryKey) && config.queryKey[0] === 'auth' && config.queryKey[1] === 'session'
      return isSession
        ? { data: sessionState.session, isLoading: sessionState.sessionLoading }
        : { data: sessionState.profile, isLoading: sessionState.profileLoading }
    },
    useQueryClient: () => queryClientState,
  }
})

vi.mock('../api/auth.api', () => ({
  getSession: vi.fn(),
  getProfile: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ data: undefined, error: null }),
  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    authStateChangeCallback = callback
    return () => undefined
  },
}))

describe('useAuth', () => {
  beforeEach(() => {
    sessionState.session = null
    sessionState.sessionLoading = false
    sessionState.profile = null
    sessionState.profileLoading = false
    queryClientState.setQueryData.mockClear()
    queryClientState.clear.mockClear()
    queryClientState.invalidateQueries.mockClear()
    authStateChangeCallback = null
  })

  it('combines session and profile state and exposes sign out', async () => {
    sessionState.session = { user: { id: 'user_1', email: 'alex@example.com' } }
    sessionState.profile = {
      id: 'user_1',
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
      email: 'alex@example.com',
      full_name: 'Alex Doe',
      avatar_url: null,
      role: 'admin',
      organization_id: 'org_1',
      onboarding_completed: true,
      preferences: {},
    }

    const { useAuth } = await import('./useAuth')
    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user?.id).toBe('user_1')
    expect(result.current.profile?.role).toBe('admin')

    await result.current.signOut()
  })

  it('reacts to auth state changes and evaluates permissions', async () => {
    sessionState.session = { user: { id: 'user_1', email: 'alex@example.com' } }
    sessionState.profile = {
      id: 'user_1',
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
      email: 'alex@example.com',
      full_name: 'Alex Doe',
      avatar_url: null,
      role: 'member',
      organization_id: 'org_1',
      onboarding_completed: true,
      preferences: {},
    }

    const { useAuth, usePermission } = await import('./useAuth')
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(authStateChangeCallback).toBeTypeOf('function')
    })

    authStateChangeCallback?.('TOKEN_REFRESHED', { user: { id: 'user_1' } })
    expect(queryClientState.setQueryData).toHaveBeenCalledWith(queryKeys.auth.session, { user: { id: 'user_1' } })
    expect(queryClientState.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.auth.profile('user_1'),
    })

    authStateChangeCallback?.('SIGNED_OUT', null)
    expect(queryClientState.clear).toHaveBeenCalledTimes(1)

    const permission = renderHook(() => usePermission('viewer'))
    expect(permission.result.current).toBe(true)
    expect(renderHook(() => usePermission('admin')).result.current).toBe(false)
    expect(result.current.profile?.role).toBe('member')
  })
})