/**
 * InsightsPanel.tsx
 *
 * Renders AI-generated insights. Two modes:
 *   compact — sidebar panel on the dashboard (3 items, no filters)
 *   full    — the /insights page (all items, filter by type/severity)
 *
 * Pattern: single component, two render modes via props.
 * Alternative would be two separate components that share a hook.
 * For small divergence like this, one component is simpler.
 * If the modes diverge significantly, split them.
 */

import { useState } from 'react'
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, FileText, CheckCircle2 } from 'lucide-react'
import { useInsights, useAcknowledgeInsight } from '../../analytics/hooks/useInsights'
import { InsightCardSkeleton } from '@/shared/components/ui/Skeleton'
import { formatRelativeTime } from '@/shared/utils/format'
import { cn } from '@/shared/utils/cn'
import type { AiInsight } from '@/shared/types/database.types'

interface InsightsPanelProps {
  organizationId: string
  compact?: boolean
}

const TYPE_CONFIG: Record<AiInsight['type'], { icon: typeof Sparkles; color: string; label: string }> = {
  anomaly: { icon: AlertTriangle, color: 'text-red-500 bg-red-50 dark:bg-red-950/30', label: 'Anomaly' },
  trend: { icon: TrendingUp, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30', label: 'Trend' },
  recommendation: { icon: Lightbulb, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30', label: 'Recommendation' },
  summary: { icon: FileText, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30', label: 'Summary' },
}

const SEVERITY_BADGE: Record<NonNullable<AiInsight['severity']>, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function InsightsPanel({ organizationId, compact = false }: InsightsPanelProps) {
  const { data: insights, isLoading } = useInsights(organizationId)
  const acknowledge = useAcknowledgeInsight(organizationId)
  const [filter, setFilter] = useState<AiInsight['type'] | 'all'>('all')

  const displayed = compact
    ? (insights ?? []).filter((i) => !i.acknowledged).slice(0, 3)
    : filter === 'all'
    ? (insights ?? [])
    : (insights ?? []).filter((i) => i.type === filter)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
          <InsightCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', compact && 'rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900')}>
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-purple-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            AI Insights
          </h2>
          {insights && insights.filter((i) => !i.acknowledged).length > 0 && (
            <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              {insights.filter((i) => !i.acknowledged).length}
            </span>
          )}
        </div>
      </div>

      {/* Type filter — full mode only */}
      {!compact && (
        <div className="flex flex-wrap gap-1">
          {(['all', 'anomaly', 'trend', 'recommendation', 'summary'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors capitalize',
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400',
              )}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Insight cards */}
      {displayed.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-400">
          No insights to show
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onAcknowledge={() => acknowledge.mutate(insight.id)}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Individual insight card ──────────────────────────────────────────────────

interface InsightCardProps {
  insight: AiInsight
  onAcknowledge: () => void
  compact: boolean
}

function InsightCard({ insight, onAcknowledge, compact }: InsightCardProps) {
  const config = TYPE_CONFIG[insight.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-opacity',
        insight.acknowledged
          ? 'border-gray-100 bg-gray-50/50 opacity-60 dark:border-gray-800 dark:bg-gray-900/50'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900',
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md', config.color)}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-50">
              {insight.title}
            </p>
            {insight.severity && (
              <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize', SEVERITY_BADGE[insight.severity])}>
                {insight.severity}
              </span>
            )}
          </div>

          {!compact && (
            <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {insight.content}
            </p>
          )}

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <time className="text-[10px] text-gray-400" dateTime={insight.created_at}>
              {formatRelativeTime(insight.created_at)}
            </time>

            {!insight.acknowledged && (
              <button
                onClick={onAcknowledge}
                className="flex items-center gap-1 text-[10px] font-medium text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={`Acknowledge insight: ${insight.title}`}
              >
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Acknowledge
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}