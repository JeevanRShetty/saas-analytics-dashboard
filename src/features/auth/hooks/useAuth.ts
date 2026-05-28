/**
 * useAuth.ts
 *
 * The primary auth hook. Every component that needs to know "who is the
 * current user" imports this hook.
 *
 * Architecture decisions:
 *
 * SINGLE SOURCE OF TRUTH
 *   The Supabase session is the canonical auth state. We don't duplicate it
 *   into Zustand — we keep it in React Query's cache and listen to Supabase's
 *   auth state change events to invalidate/update.
 *
 * TWO-LAYER AUTH DATA
 *   Layer 1: Supabase session (email, userId, JWT) — from auth.getSession()
 *   Layer 2: Profile (role, org, preferences) — from our profiles table
 *
 *   These are separate because they have different update frequencies and
 *   ownership. The session is owned by Supabase Auth. The profile is owned
 *   by our application. Keeping them separate means a profile update doesn't
 *   force a session re-fetch and vice versa.
 *
 * LOADING STATES
 *   There's a difference between "we haven't checked for a session yet"
 *   (initial load, show full-page spinner) and "we know there's no session"
 *   (redirect to login). We expose isLoading to distinguish these.
 */

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { getSession, getProfile, signOut, onAuthStateChange } from '../api/auth.api'
import type { Profile } from '@/shared/types/database.types'

export function useAuth() {
  const queryClient = useQueryClient()

  // ── Session query ────────────────────────────────────────────────────────
  const {
    data: session,
    isLoading: isSessionLoading,
  } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: getSession,
    // Sessions don't go stale — Supabase handles refresh via events
    staleTime: Infinity,
    // Keep session in cache indefinitely while app is running
    gcTime: Infinity,
  })

  // ── Profile query ────────────────────────────────────────────────────────
  const {
    data: profile,
    isLoading: isProfileLoading,
  } = useQuery({
    queryKey: queryKeys.auth.profile(session?.user.id ?? ''),
    queryFn: () => getProfile(session!.user.id).then((r) => (r.error ? null : r.data)),
    // Only run when we have a session
    enabled: !!session?.user.id,
    staleTime: 1000 * 60 * 10, // 10 minutes — profiles rarely change
  })

  // ── Listen for auth state changes ────────────────────────────────────────
  // Supabase emits events for: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED,
  // USER_UPDATED, PASSWORD_RECOVERY, MFA_CHALLENGE_VERIFIED
  useEffect(() => {
    const unsubscribe = onAuthStateChange((event, newSession) => {
      // Update the session cache immediately — no refetch needed
      queryClient.setQueryData(queryKeys.auth.session, newSession)

      if (event === 'SIGNED_OUT') {
        // Clear ALL cached queries on sign out — don't leak data between users
        queryClient.clear()
      }

      if (event === 'TOKEN_REFRESHED' && newSession?.user.id) {
        // Invalidate profile to pick up any role/permission changes
        void queryClient.invalidateQueries({
          queryKey: queryKeys.auth.profile(newSession.user.id),
        })
      }
    })

    return unsubscribe
  }, [queryClient])

  // ── Sign out ─────────────────────────────────────────────────────────────
  async function handleSignOut() {
    await signOut()
    // onAuthStateChange will fire SIGNED_OUT and clear the cache
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const isAuthenticated = !!session
  const isLoading = isSessionLoading || (isAuthenticated && isProfileLoading)
  const user = session?.user ?? null

  return {
    // State
    session,
    user,
    profile: profile ?? null,
    isAuthenticated,
    isLoading,

    // Actions
    signOut: handleSignOut,
  }
}

// ─── Permission hook ──────────────────────────────────────────────────────────
/**
 * Convenience hook for permission checks.
 * Usage: const canEdit = usePermission('admin')
 */
export function usePermission(requiredRole: Profile['role']): boolean {
  const { profile } = useAuth()
  if (!profile) return false

  const hierarchy: Record<Profile['role'], number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  }

  return hierarchy[profile.role] >= hierarchy[requiredRole]
}