/**
 * useNotifications.ts
 *
 * Notifications combine two data sources:
 *   1. React Query — initial fetch and cache of existing notifications
 *   2. Supabase Realtime — WebSocket subscription that pushes new notifications
 *      as they are inserted into the DB
 *
 * The integration pattern:
 *   When Realtime fires an INSERT event, we don't re-fetch from the server.
 *   We prepend the new notification directly into the React Query cache.
 *   This gives instant UI updates with zero additional network requests.
 *
 *   If the WebSocket disconnects and reconnects, we invalidate the query
 *   to re-sync — a simple recovery strategy that handles missed events.
 *
 * Why not use Realtime for everything?
 *   Realtime subscriptions are persistent WebSocket connections. Each one
 *   consumes a connection slot. For data that changes infrequently or doesn't
 *   need push (audit logs, insights), React Query's background refetch
 *   is sufficient and lighter weight.
 */

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { queryKeys } from '@/shared/lib/queryClient'
import type { Notification } from '@/shared/types/database.types'

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return data ?? []
}

async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
  if (error) throw new Error(error.message)
}

async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw new Error(error.message)
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useNotifications(userId: string) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.notifications.list(userId)

  const query = useQuery({
    queryKey,
    queryFn: () => fetchNotifications(userId),
    staleTime: 1000 * 30, // 30 seconds — notifications need near-real-time feel
    enabled: !!userId,
  })

  // ── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification

          // Prepend into cache immediately — no re-fetch needed
          queryClient.setQueryData<Notification[]>(queryKey, (old) =>
            old ? [newNotification, ...old] : [newNotification],
          )

          // Also invalidate the unread count
          void queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.unreadCount(userId),
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification
          queryClient.setQueryData<Notification[]>(queryKey, (old) =>
            old?.map((n) => (n.id === updated.id ? updated : n)) ?? [],
          )
          void queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.unreadCount(userId),
          })
        },
      )
      .subscribe((status) => {
        // If we reconnected after a disconnect, invalidate to catch missed events
        if (status === 'SUBSCRIBED') {
          void queryClient.invalidateQueries({ queryKey })
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, queryClient, queryKey])

  return query
}

export function useNotificationCount(userId: string) {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(userId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw new Error(error.message)
      return count ?? 0
    },
    staleTime: 1000 * 30,
    enabled: !!userId,
  })
}

export function useMarkNotificationRead(userId: string) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.notifications.list(userId)

  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey })
      const snapshot = queryClient.getQueryData<Notification[]>(queryKey)

      // Optimistic update
      queryClient.setQueryData<Notification[]>(queryKey, (old) =>
        old?.map((n) => (n.id === notificationId ? { ...n, read: true } : n)) ?? [],
      )

      return { snapshot }
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) queryClient.setQueryData(queryKey, context.snapshot)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) })
    },
  })
}

export function useMarkAllRead(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => markAllRead(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) })
    },
  })
}