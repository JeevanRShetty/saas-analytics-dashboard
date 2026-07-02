/**
 * Sidebar.tsx
 *
 * Navigation sidebar with collapsible behavior and role-based item visibility.
 *
 * Key patterns:
 *
 * NAVITEM DATA ARRAY
 *   Nav items are declared as data, not JSX. This means adding a new route
 *   is a one-line change. It also means we can filter items by role in one
 *   place rather than scattering conditional rendering across JSX.
 *
 * ACTIVE STATE via NavLink
 *   React Router's NavLink automatically applies an 'active' class when its
 *   href matches the current URL. We use this rather than manually comparing
 *   location.pathname — it handles nested routes correctly.
 *
 * ACCESSIBLE COLLAPSED STATE
 *   When collapsed, we show only icons. We keep aria-label on each link
 *   so screen readers announce the destination even without visible text.
 *   A tooltip on hover communicates the destination to sighted users.
 */

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BarChart3, ScrollText, Bell, Users,
  Settings, ChevronLeft, ChevronRight, Sparkles, Building2,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cn } from '@/shared/utils/cn'
import type { UserRole } from '@/shared/types/database.types'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  requiredRole?: UserRole
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'AI Insights', href: '/dashboard/insights', icon: Sparkles },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: ScrollText, requiredRole: 'admin' },
  { label: 'Team', href: '/dashboard/team', icon: Users, requiredRole: 'admin' },
  { label: 'Organization', href: '/dashboard/organization', icon: Building2, requiredRole: 'owner' },
]

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 4, admin: 3, member: 2, viewer: 1,
}

function hasRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required]
}

export function Sidebar() {
  const isSidebarCollapsed = useUIStore((s) => s.isSidebarCollapsed)
  const toggleSidebarCollapsed = useUIStore((s) => s.toggleSidebarCollapsed)
  const { profile } = useAuth()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.requiredRole || (profile && hasRole(profile.role, item.requiredRole)),
  )

  return (
    <aside
      className={cn(
        'border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
        'overflow-hidden md:[grid-area:sidebar] md:flex md:flex-col md:border-b-0 md:border-r',
      )}
      aria-label="Main navigation"
    >
      {/* Logo area */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 md:h-14 md:py-0">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              Analytics
            </span>
          </div>
        )}
        {isSidebarCollapsed && (
          <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-xs font-bold text-white">A</span>
          </div>
        )}
        {!isSidebarCollapsed && (
          <button
            onClick={toggleSidebarCollapsed}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isSidebarCollapsed && (
        <button
          onClick={toggleSidebarCollapsed}
          className="mx-auto mb-2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Nav items */}
      <nav className="grid grid-cols-2 gap-2 px-4 py-3 md:flex md:flex-1 md:flex-col md:space-y-0.5 md:overflow-y-auto md:px-2 md:py-2">
        {visibleItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} collapsed={isSidebarCollapsed} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="shrink-0 space-y-2 border-t border-gray-200 px-4 py-3 dark:border-gray-800 md:space-y-0.5 md:px-2">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.href} item={item} collapsed={isSidebarCollapsed} />
        ))}

        {/* User avatar */}
        {!isSidebarCollapsed && profile && (
          <div className="mt-2 flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                {profile.full_name?.[0]?.toUpperCase() ?? profile.email[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-gray-900 dark:text-gray-50">
                {profile.full_name ?? profile.email}
              </p>
              <p className="truncate text-xs capitalize text-gray-500 dark:text-gray-400">
                {profile.role}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

// ─── NavItem component ────────────────────────────────────────────────────────

function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.href}
      end={item.href === '/dashboard'}
      aria-label={item.label}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
          isActive && 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
          collapsed && 'justify-center px-2',
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}