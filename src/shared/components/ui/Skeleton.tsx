/**
 * Skeleton.tsx
 *
 * Loading skeleton primitives and composed skeletons for specific sections.
 *
 * Why skeletons instead of spinners?
 *   Skeletons communicate the shape of incoming content, reducing perceived
 *   load time. Users understand they're waiting for a table, not just
 *   "something". Research (and intuition) show skeletons feel faster than
 *   spinners even when load time is identical.
 *
 * Two levels:
 *   1. Primitive <Skeleton /> — a shimmer rectangle, sized via className
 *   2. Composed skeletons — match specific section layouts (stats, table, chart)
 *
 * The composed skeletons should exactly match the layout of the real component.
 * When the data arrives, the layout shift is zero — content pops in where
 * the skeleton was.
 */

import { cn } from '@/shared/utils/cn'

// ─── Primitive ────────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-800',
        className,
      )}
      aria-hidden="true"
    />
  )
}

// ─── Stat card skeleton ───────────────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  )
}

// ─── Chart skeleton ───────────────────────────────────────────────────────────

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="w-full rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6"
      style={{ height }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="mt-6 flex items-end gap-3" style={{ height: height - 100 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 last:border-0 dark:border-gray-800 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className="h-4 flex-1"
              style={{ width: `${Math.random() * 40 + 60}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Insight card skeleton ────────────────────────────────────────────────────

export function InsightCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </div>
  )
}

// ─── Full app shell skeleton ──────────────────────────────────────────────────
// Used by AuthGuard while we determine if the user is authenticated

export function AppShellSkeleton({ minimal = false }: { minimal?: boolean }) {
  if (minimal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950 md:h-screen md:flex-row">
      {/* Sidebar skeleton */}
      <div className="flex w-full flex-col border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:w-64 md:border-b-0 md:border-r">
        <Skeleton className="h-8 w-32" />
        <div className="mt-8 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 p-4 sm:p-8">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="mt-6">
          <ChartSkeleton height={320} />
        </div>
      </div>
    </div>
  )
}