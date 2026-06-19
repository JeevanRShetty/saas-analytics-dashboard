/**
 * AnalyticsPage.tsx
 *
 * The full analytics view. Three sections:
 *   1. Device breakdown — pie/bar chart
 *   2. Top pages — bar chart
 *   3. Raw events table — TanStack Table with server-side pagination + filters
 *
 * TanStack Table decisions:
 *   - Server-side pagination: we never load all events client-side.
 *     The table controls page/pageSize and passes them to the query.
 *   - Column definitions typed against the row shape — no any[] columns.
 *   - Sorting state is local (client-side sort on current page) for now.
 *     At scale, sorting should move server-side too.
 */

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAnalyticsSummary, useAnalyticsEvents } from '../../analytics/hooks/useAnalytics'
import { FilterBar } from '@/features/dashboard/components/FilterBar'
import { TableSkeleton, ChartSkeleton } from '@/shared/components/ui/Skeleton'
import { formatDateTime, formatCompactNumber } from '@/shared/utils/format'
import { cn } from '@/shared/utils/cn'
import type { AnalyticsEvent } from '@/shared/types/database.types'

const DEVICE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981']

export function AnalyticsPage() {
  const { profile } = useAuth()
  const orgId = profile?.organization_id ?? ''
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(orgId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Analytics</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Detailed event and session breakdown
          </p>
        </div>
        <FilterBar />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Device breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">
            Device breakdown
          </h2>
          {summaryLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={summary?.deviceBreakdown ?? []}
                    dataKey="count"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {(summary?.deviceBreakdown ?? []).map((_, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {(summary?.deviceBreakdown ?? []).map((item, i) => (
                  <div key={item.device} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }}
                    />
                    <span className="capitalize text-gray-600 dark:text-gray-400">{item.device}</span>
                    <span className="font-medium tabular-nums text-gray-900 dark:text-gray-50">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top pages */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-50">
            Top pages
          </h2>
          {summaryLoading ? (
            <ChartSkeleton height={160} />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={summary?.topPages?.slice(0, 6) ?? []}
                layout="vertical"
                margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatCompactNumber(v)} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="page" tick={{ fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Views']} />
                <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Events table */}
      <EventsTable organizationId={orgId} />
    </div>
  )
}

// ─── Events table ─────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<AnalyticsEvent>()

const columns = [
  columnHelper.accessor('created_at', {
    header: 'Time',
    cell: (info) => (
      <time className="tabular-nums text-gray-500" dateTime={info.getValue()}>
        {formatDateTime(info.getValue())}
      </time>
    ),
  }),
  columnHelper.accessor('event_type', {
    header: 'Event',
    cell: (info) => (
      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('page_url', {
    header: 'Page',
    cell: (info) => (
      <span className="max-w-xs truncate text-gray-700 dark:text-gray-300" title={info.getValue() ?? ''}>
        {info.getValue() ?? '—'}
      </span>
    ),
  }),
  columnHelper.accessor('device_type', {
    header: 'Device',
    cell: (info) => (
      <span className="capitalize text-gray-500">{info.getValue() ?? '—'}</span>
    ),
  }),
  columnHelper.accessor('country', {
    header: 'Country',
    cell: (info) => <span className="text-gray-500">{info.getValue() ?? '—'}</span>,
  }),
]

function EventsTable({ organizationId }: { organizationId: string }) {
  const [page, setPage] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const pageSize = 10

  const { data, isLoading, isFetching } = useAnalyticsEvents(organizationId, page, pageSize, {})

  const table = useReactTable({
    data: useMemo(() => data?.data ?? [], [data]),
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: data ? Math.ceil(data.total / pageSize) : -1,
  })

  if (isLoading) return <TableSkeleton rows={10} columns={5} />

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900', isFetching && 'opacity-75')}>
      {/* Table header */}
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Events
          {data && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              {data.total.toLocaleString()} total
            </span>
          )}
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-gray-100 dark:border-gray-800">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className={cn(
                          'flex items-center gap-1',
                          header.column.getCanSort() && 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-gray-300">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-50 text-xs transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-800/30"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-5 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-gray-800">
        <p className="text-xs text-gray-400">
          Page {page + 1} of {data ? Math.ceil(data.total / pageSize) : '—'}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data?.hasNextPage}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}