/**
 * EventsChart.tsx
 *
 * Area chart showing events and sessions over the selected date range.
 *
 * Recharts decisions:
 *   - ResponsiveContainer makes the chart fill its parent width — no JS
 *     resize listeners needed
 *   - We use CSS variables for colors so dark mode works automatically
 *     without passing theme props into chart components
 *   - CustomTooltip gives us full control over the tooltip UI — the
 *     default Recharts tooltip doesn't match our design system
 *   - dot={false} on the line improves performance for large datasets —
 *     rendering 365 SVG circle elements is measurable overhead
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useAnalyticsSummary } from '@/features/analytics/hooks/useAnalytics'
import { ChartSkeleton } from '@/shared/components/ui/Skeleton'
import { formatChartDate, formatCompactNumber } from '@/shared/utils/format'

interface EventsChartProps {
  organizationId: string
}

export function EventsChart({ organizationId }: EventsChartProps) {
  const { data, isLoading } = useAnalyticsSummary(organizationId)

  if (isLoading && !data) {
    return <ChartSkeleton height={320} />
  }

  const chartData = (data?.timeSeriesData ?? []).map((d) => ({
    ...d,
    dateLabel: formatChartDate(d.date),
  }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Events over time
        </h2>
        <span className="text-xs text-gray-400">
          {chartData.length} data points
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-gray-100 dark:text-gray-800"
            vertical={false}
          />

          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-gray-400"
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-gray-400"
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCompactNumber(v)}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            formatter={(value: string) =>
              <span className="text-xs capitalize text-gray-600 dark:text-gray-400">{value}</span>
            }
          />

          <Area
            type="monotone"
            dataKey="events"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#eventsGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />

          <Area
            type="monotone"
            dataKey="sessions"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#sessionsGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span className="capitalize text-gray-600 dark:text-gray-400">{item.name}:</span>
          <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-50">
            {item.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}