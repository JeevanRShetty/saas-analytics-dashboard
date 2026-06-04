/**
 * NotificationsPage.tsx
 *
 * Full notifications list with real-time updates, read/unread state,
 * and mark-all-read. New notifications appear at the top instantly
 * via the Realtime WebSocket — no polling.
 */

import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from '../hooks/useNotifications'
import { formatRelativeTime } from '@/shared/utils/format'
import { cn } from '@/shared/utils/cn'
import type { Notification } from '@/shared/types/database.types'

const TYPE_STYLES: Record<Notification['type'], { dot: string; bg: string }> = {
  info: { dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
  success: { dot: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-950/20' },
  warning: { dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  error: { dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-950/20' },
}

export function NotificationsPage() {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const { data: notifications, isLoading } = useNotifications(userId)
  const markRead = useMarkNotificationRead(userId)
  const markAllRead = useMarkAllRead(userId)

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Notifications
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <NotificationsSkeleton />
        ) : !notifications?.length ? (
          <EmptyNotifications />
        ) : (
          <ul
            className="divide-y divide-gray-100 dark:divide-gray-800"
            aria-label="Notifications"
            aria-live="polite"
            aria-relevant="additions"
          >
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => markRead.mutate(notification.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Notification item ────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead: () => void
}) {
  const styles = TYPE_STYLES[notification.type]

  return (
    <li
      className={cn(
        'flex items-start gap-4 px-5 py-4 transition-colors',
        !notification.read && styles.bg,
      )}
    >
      {/* Unread indicator */}
      <div className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center">
        {!notification.read ? (
          <span className={cn('h-2 w-2 rounded-full', styles.dot)} aria-label="Unread" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-gray-200 dark:bg-gray-700" aria-label="Read" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium', notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-50')}>
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {notification.body}
        </p>
        <time
          dateTime={notification.created_at}
          className="mt-1.5 block text-[10px] text-gray-400"
        >
          {formatRelativeTime(notification.created_at)}
        </time>
      </div>

      {/* Mark read button */}
      {!notification.read && (
        <button
          onClick={onMarkRead}
          className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          aria-label={`Mark "${notification.title}" as read`}
        >
          <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </li>
  )
}

// ─── Empty / loading states ───────────────────────────────────────────────────

function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <BellOff className="h-8 w-8 text-gray-300 dark:text-gray-700" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-gray-500">No notifications yet</p>
        <p className="text-xs text-gray-400">We'll let you know when something happens</p>
      </div>
    </div>
  )
}

function NotificationsSkeleton() {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-5 py-4">
          <div className="mt-1.5 h-2 w-2 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  )
}