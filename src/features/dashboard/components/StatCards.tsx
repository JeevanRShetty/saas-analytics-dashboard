/**
 * StatCards.tsx
 *
 * Four KPI cards at the top of the dashboard.
 *
 * Performance pattern: SUSPENSE via placeholderData
 *   We use React Query's placeholderData to keep previous data visible
 *   while new data loads (e.g. user changes date range). The cards never
 *   flash empty — they show the last known values with a subtle opacity
 *   fade to signal they're refreshing.
 *
 *   This is superior to showing skeletons on every filter change because
 *   it prevents layout shifts and feels responsive.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useStatCards } from '@/features/analytics/hooks/useAnalytics'
import { StatCardSkeleton } from '@/shared/components/ui/Skeleton'
import { cn } from '@/shared/utils/cn'

interface StatCardsProps {
  organizationId: string
}

export function StatCards({ organizationId }: StatCardsProps) {
  const { cards, isLoading } = useStatCards(organizationId)

  if (isLoading && cards.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} card={card} isRefreshing={isLoading} />
      ))}
    </div>
  )
}

interface StatCardProps {
  card: {
    label: string
    value: string
    delta: number
    trend: 'up' | 'down' | 'neutral'
  }
  isRefreshing: boolean
}

function StatCard({ card, isRefreshing }: StatCardProps) {
  const TrendIcon = card.trend === 'up'
    ? TrendingUp
    : card.trend === 'down'
    ? TrendingDown
    : Minus

  const trendColor = card.trend === 'up'
    ? 'text-green-600 dark:text-green-400'
    : card.trend === 'down'
    ? 'text-red-600 dark:text-red-400'
    : 'text-gray-500 dark:text-gray-400'

  const deltaFormatted = `${card.delta >= 0 ? '+' : ''}${(card.delta * 100).toFixed(1)}%`

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900',
        'transition-opacity duration-200',
        isRefreshing && 'opacity-60',
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {card.label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-50">
        {card.value}
      </p>
      <div className={cn('mt-1.5 flex items-center gap-1 text-xs font-medium', trendColor)}>
        <TrendIcon className="h-3 w-3" aria-hidden="true" />
        <span>{deltaFormatted} vs last period</span>
      </div>
    </div>
  )
}