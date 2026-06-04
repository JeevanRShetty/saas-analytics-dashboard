/**
 * RecentActivity.tsx
 *
 * A lightweight activity feed showing the most recent audit log entries.
 * Uses a slim read from audit_logs — no pagination here, just the last 10.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { queryKeys } from '@/shared/lib/queryClient'
import { formatRelativeTime, slugToTitle } from '@/shared/utils/format'
import { TableSkeleton } from '@/shared/components/ui/Skeleton'

interface RecentActivityProps {
  organizationId: string
}

export function RecentActivity({ organizationId }: RecentActivityProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: [...queryKeys.auditLogs.all, 'recent', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, created_at, actor_email, action, resource_type')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(8)

      if (error) throw new Error(error.message)
      return data
    },
    staleTime: 1000 * 30,
    enabled: !!organizationId,
  })

  if (isLoading) return <TableSkeleton rows={6} columns={3} />

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Recent activity
        </h2>
      </div>

      {!logs?.length ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          No recent activity
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center gap-4 px-5 py-3">
              {/* Actor avatar */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {log.actor_email[0]?.toUpperCase() ?? '?'}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-gray-50">
                    {log.actor_email}
                  </span>
                  {' '}
                  <span className="text-gray-500">{slugToTitle(log.action)}</span>
                  {' '}
                  <span className="font-medium">{slugToTitle(log.resource_type)}</span>
                </p>
              </div>

              <time
                dateTime={log.created_at}
                className="shrink-0 text-xs text-gray-400"
              >
                {formatRelativeTime(log.created_at)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}