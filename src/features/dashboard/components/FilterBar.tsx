/**
 * FilterBar.tsx
 *
 * Dashboard filter controls: date range preset selector.
 * Changes here update the Zustand filtersStore, which React Query
 * picks up automatically via the query key including the date range.
 *
 * This is the "reactive filter" pattern:
 *   Filter state → query key changes → React Query refetches
 *   No imperative "go fetch this now" calls. Declarative all the way down.
 */

import { useFiltersStore } from '@/store/filtersStore'
import { cn } from '@/shared/utils/cn'
import type { DateRangePreset } from '@/shared/types/app.types'

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '1y', value: '1y' },
]

export function FilterBar() {
  const { dateRangePreset, setDateRangePreset } = useFiltersStore()

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          onClick={() => setDateRangePreset(preset.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            dateRangePreset === preset.value
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100',
          )}
          aria-pressed={dateRangePreset === preset.value}
        >
          {preset.label}
        </button>
      ))}
    </div>
  )
}