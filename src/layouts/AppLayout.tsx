/**
 * AppLayout.tsx
 *
 * The persistent shell that wraps every authenticated route.
 * Renders once — the sidebar, header, and toast container never unmount
 * as users navigate between dashboard pages. Only the <Outlet /> changes.
 *
 * Layout decisions:
 *
 * CSS GRID vs FLEXBOX for the shell
 *   We use CSS grid with named template areas. This lets us express the
 *   layout semantically ("sidebar occupies the left column, header the top
 *   row") rather than nesting flex containers. The collapsed sidebar state
 *   is handled by changing the grid-template-columns value — no JS layout
 *   calculation needed.
 *
 * SIDEBAR WIDTH via CSS VARIABLE
 *   The sidebar width is defined as a CSS variable so the header and main
 *   content area don't need JS to know the sidebar width. They respond
 *   to the variable automatically. This pattern eliminates a common class
 *   of layout bugs where computed widths go out of sync.
 */

import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ToastContainer } from '@/shared/components/ui/Toast'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/shared/utils/cn'

export function AppLayout() {
  const isSidebarCollapsed = useUIStore((s) => s.isSidebarCollapsed)

  return (
    <div
      className={cn(
        'grid h-screen overflow-hidden bg-gray-50 dark:bg-gray-950',
        'transition-[grid-template-columns] duration-200',
        isSidebarCollapsed
          ? '[grid-template-areas:"sidebar_header""sidebar_main"] [grid-template-columns:64px_1fr] [grid-template-rows:56px_1fr]'
          : '[grid-template-areas:"sidebar_header""sidebar_main"] [grid-template-columns:240px_1fr] [grid-template-rows:56px_1fr]',
      )}
    >
      {/* Sidebar — [grid-area:sidebar] */}
      <Sidebar />

      {/* Header — [grid-area:header] */}
      <Header />

      {/* Main content — [grid-area:main] */}
      <main
        className="[grid-area:main] overflow-y-auto"
        id="main-content"
        tabIndex={-1}
      >
        <div className="mx-auto max-w-7xl p-6">
          <Outlet />
        </div>
      </main>

      {/* Toasts — rendered outside the grid, fixed positioned */}
      <ToastContainer />
    </div>
  )
}