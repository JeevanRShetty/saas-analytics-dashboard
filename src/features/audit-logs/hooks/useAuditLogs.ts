import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { queryKeys } from '@/shared/lib/queryClient'
import type { AuditLog } from '@/shared/types/database.types'
import type { PaginatedResult } from '@/shared/types/app.types'

export interface AuditLogFilters {
  actorEmail?: string
  action?: string
  resourceType?: string
  search?: string
  fromDate?: string
  toDate?: string
}

async function fetchAuditLogs(
  organizationId: string,
  page: number,
  pageSize: number,
  filters: AuditLogFilters,
): Promise<PaginatedResult<AuditLog>> {
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (filters.actorEmail) query = query.ilike('actor_email', `%${filters.actorEmail}%`)
  if (filters.action) query = query.eq('action', filters.action)
  if (filters.resourceType) query = query.eq('resource_type', filters.resourceType)
  if (filters.fromDate) query = query.gte('created_at', filters.fromDate)
  if (filters.toDate) query = query.lte('created_at', filters.toDate)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  const total = count ?? 0
  return {
    data: data ?? [],
    total,
    page,
    pageSize,
    hasNextPage: (page + 1) * pageSize < total,
  }
}

export function useAuditLogs(
  organizationId: string,
  page: number,
  pageSize: number,
  filters: AuditLogFilters,
) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(organizationId, page, filters),
    queryFn: () => fetchAuditLogs(organizationId, page, pageSize, filters),
    placeholderData: (prev) => prev,
    enabled: !!organizationId,
    staleTime: 1000 * 60,
  })
}