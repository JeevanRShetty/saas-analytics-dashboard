/**
 * AuditLogsPage.tsx
 *
 * Full audit log viewer with:
 *   - Server-side pagination
 *   - Debounced search (avoids firing a request on every keystroke)
 *   - Filter by action and resource type
 *   - Copy row metadata to clipboard
 *
 * DEBOUNCE PATTERN:
 *   The search input is controlled (React state) for immediate UI feedback.
 *   A separate debounced value (updated 400ms after the last keystroke)
 *   is what flows into the query key. This means:
 *   - Input feels instant
 *   - Network requests fire only when typing pauses
 *   - Zero additional libraries needed (custom useDebounce hook)
 */

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { Search, Copy, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAuditLogs } from '../hooks/useAuditLogs'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { formatDateTime, slugToTitle } from '@/shared/utils/format'
import { TableSkeleton } from '@/shared/components/ui/Skeleton'
import { useToast } from '@/shared/components/ui/Toast'
import { cn } from '@/shared/utils/cn'
import type { AuditLog } from '@/shared/types/database.types'

const columnHelper = createColumnHelper<AuditLog>()

const columns = [
  columnHelper.accessor('created_at', {
    header: 'Timestamp',
    cell: (info) => (
      <time className="tabular-nums text-xs text-gray-500" dateTime={info.getValue()}>
        {formatDateTime(info.getValue())}
      </time>
    ),
  }),
  columnHelper.accessor('actor_email', {
    header: 'Actor',
    cell: (info) => (
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('action', {
    header: 'Action',
    cell: (info) => (
      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('resource_type', {
    header: 'Resource',
    cell: (info) => (
      <span className="text-xs text-gray-500">{slugToTitle(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor('ip_address', {
    header: 'IP',
    cell: (info) => (
      <span className="font-mono text-xs text-gray-400">{info.getValue() ?? '—'}</span>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: ({ row }) => <CopyMetadataButton log={row.original} />,
  }),
]

export function AuditLogsPage() {
  const { profile } = useAuth()
  const orgId = profile?.organization_id ?? ''
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 400)
  const pageSize = 15

  const { data, isLoading, isFetching } = useAuditLogs(orgId, page, pageSize, {
    actorEmail: debouncedSearch || undefined,
  })

  // Reset to first page when search changes
  const handleSearch = (value: string) => {
    setSearchInput(value)
    setPage(0)
  }

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data ? Math.ceil(data.total / pageSize) : -1,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Audit Logs</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Complete record of all actions in your organization
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search by actor email..."
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className={cn(
            'block w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm',
            'text-gray-900 placeholder:text-gray-400',
            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
            'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50',
          )}
        />
      </div>

      {/* Table */}
      <div
        className={cn(
          'rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
          isFetching && 'opacity-75',
        )}
      >
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            Events
            {data && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                {data.total.toLocaleString()} total
              </span>
            )}
          </span>
        </div>

        {isLoading ? (
          <TableSkeleton rows={15} columns={6} />
        ) : (
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
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 text-xs last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-800/30"
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
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-gray-800">
          <p className="text-xs text-gray-400">
            {data
              ? `Showing ${page * pageSize + 1}–${Math.min((page + 1) * pageSize, data.total)} of ${data.total.toLocaleString()}`
              : '—'}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data?.hasNextPage}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Copy metadata button ─────────────────────────────────────────────────────

function CopyMetadataButton({ log }: { log: AuditLog }) {
  const { success } = useToast()

  function handleCopy() {
    void navigator.clipboard.writeText(JSON.stringify(log.metadata, null, 2))
    success('Copied', 'Metadata copied to clipboard')
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-md p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      aria-label="Copy event metadata"
      title="Copy metadata"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  )
}