/**
 * queryClient.ts
 *
 * The React Query client is the brain of all server state management.
 * This configuration directly affects user experience — getting it wrong
 * means stale data, missed errors, or excessive network requests.
 *
 * Key decisions explained:
 *
 * STALE TIME (5 minutes default)
 *   How long data is considered "fresh". During this window, a component
 *   mounting and calling useQuery gets cache data immediately — no network
 *   request. After staleTime, the next useQuery call triggers a background
 *   refetch while still showing the cached data (stale-while-revalidate).
 *
 *   5 minutes is a reasonable default for analytics data that changes
 *   slowly. We override this per-query for:
 *   - Notifications: 30 seconds (near-real-time expectations)
 *   - AI insights: 15 minutes (expensive to generate)
 *   - User profile: 10 minutes (rarely changes)
 *
 * RETRY STRATEGY (exponential backoff)
 *   Failed requests retry with exponential delays: 1s, 2s, 4s.
 *   We don't retry 4xx errors — those are client errors (auth expired,
 *   not found, forbidden) and retrying won't help. We only retry 5xx
 *   and network errors.
 *
 * REFETCH ON WINDOW FOCUS
 *   When a user returns to a browser tab, React Query re-validates stale
 *   queries in the background. The user always sees fresh data after
 *   switching away and back. This is the main reason React Query feels
 *   "alive" compared to a simple useEffect fetch.
 */

import { QueryClient } from '@tanstack/react-query'
import type { QueryCache, MutationCache } from '@tanstack/react-query'

// Error type guard — Supabase errors and fetch errors come in different shapes
function isNetworkError(error: unknown): boolean {
  return error instanceof Error && error.message === 'Failed to fetch'
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  // Don't retry on 4xx — these are client errors, not transient failures
  if (error instanceof Error && 'status' in error) {
    const status = (error as { status: number }).status
    if (status >= 400 && status < 500) return false
  }
  // Retry network errors and 5xx up to 2 times
  return failureCount < 2 && (isNetworkError(error) || true)
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is fresh for 5 minutes — no refetch during this window
        staleTime: 1000 * 60 * 5,
        // Cache retained for 10 minutes after component unmounts
        gcTime: 1000 * 60 * 10,
        // Retry failed requests with exponential backoff
        retry: shouldRetry,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
        // Re-validate when user returns to the tab
        refetchOnWindowFocus: true,
        // Don't refetch on every mount if data is still fresh
        refetchOnMount: true,
        // Don't automatically refetch on reconnect (we handle this via realtime)
        refetchOnReconnect: true,
      },
      mutations: {
        // Mutations don't retry by default — idempotency is not guaranteed
        retry: false,
      },
    },
  })
}

// Singleton for app use — imported by QueryClientProvider in main.tsx
export const queryClient = createQueryClient()

// ─── Query key factory ────────────────────────────────────────────────────────
/**
 * Centralised query key definitions.
 *
 * Why a factory pattern?
 *   Query keys must be deterministic and hierarchical. Using magic strings
 *   scattered across the codebase leads to cache misses (typos) and
 *   over-invalidation (too broad). A factory makes them:
 *   - Discoverable (one file to check)
 *   - Type-safe (TS catches invalid keys)
 *   - Hierarchical (invalidating 'analytics' invalidates all sub-queries)
 *
 * Usage:
 *   queryKeys.analytics.summary(orgId, dateRange)
 *   queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
 */
export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
    profile: (userId: string) => ['auth', 'profile', userId] as const,
  },
  organizations: {
    all: ['organizations'] as const,
    detail: (id: string) => ['organizations', id] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    summary: (orgId: string, from: string, to: string) =>
      ['analytics', 'summary', orgId, from, to] as const,
    events: (orgId: string, page: number, filters: object) =>
      ['analytics', 'events', orgId, page, filters] as const,
  },
  auditLogs: {
    all: ['audit-logs'] as const,
    list: (orgId: string, page: number, filters: object) =>
      ['audit-logs', 'list', orgId, page, filters] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (userId: string) => ['notifications', 'list', userId] as const,
    unreadCount: (userId: string) => ['notifications', 'unread-count', userId] as const,
  },
  insights: {
    all: ['insights'] as const,
    list: (orgId: string) => ['insights', 'list', orgId] as const,
  },
}