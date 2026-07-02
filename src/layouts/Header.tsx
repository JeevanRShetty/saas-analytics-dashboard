/**
 * Header.tsx
 *
 * App-wide top bar. Intentionally thin — it holds navigation affordances
 * (search, notifications, theme) but zero business logic.
 */

import { Search, Moon, Sun, Monitor, Bell, LogOut } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useNotificationCount } from '@/features/notifications/hooks/useNotifications'
import { cn } from '@/shared/utils/cn'
import type { ThemeMode } from '@/shared/types/app.types'

const THEME_ICONS: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const THEME_CYCLE: ThemeMode[] = ['light', 'dark', 'system']

export function Header() {
  const { mode, setTheme } = useThemeStore()
  const openCommandPalette = useUIStore((s) => s.openCommandPalette)
  const { user, signOut } = useAuth()
  const { data: unreadCount } = useNotificationCount(user?.id ?? '')

  const ThemeIcon = THEME_ICONS[mode]

  function cycleTheme() {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(mode) + 1) % THEME_CYCLE.length]
    setTheme(next ?? 'system')
  }

  return (
    <header
      className={cn(
        '[grid-area:header]',
        'flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900',
        'sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-0 sm:h-14',
      )}
    >
      {/* Search — opens command palette */}
      <button
        onClick={openCommandPalette}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50',
          'px-3 py-1.5 text-sm text-gray-400 transition-colors',
          'hover:border-gray-300 hover:text-gray-600',
          'dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600',
          'w-full sm:w-56',
        )}
        aria-label="Open search"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Search...</span>
        <kbd className="ml-auto rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700">
          ⌘K
        </kbd>
      </button>

      {/* Right controls */}
      <div className="flex items-center justify-end gap-1 self-end sm:self-auto">
        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          aria-label={`Current theme: ${mode}. Click to change.`}
          title={`Theme: ${mode}`}
        >
          <ThemeIcon className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Notifications */}
        <NotificationBell unreadCount={unreadCount ?? 0} />

        {/* Sign out */}
        <button
          onClick={() => void signOut()}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}

function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <a
      href="/dashboard/notifications"
      className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <Bell className="h-4 w-4" aria-hidden="true" />
      {unreadCount > 0 && (
        <span
          className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
          aria-hidden="true"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </a>
  )
}