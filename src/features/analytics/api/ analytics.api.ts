/**
 * analytics.api.ts
 *
 * All analytics data fetching. Supabase queries are typed end-to-end —
 * the return types are inferred from the Database schema, not hand-written.
 *
 * Performance note: The summary function calls a Supabase RPC (stored procedure)
 * rather than fetching raw events and aggregating client-side. This is a
 * critical performance decision — aggregating millions of events in the browser
 * would be catastrophically slow. Heavy aggregation belongs in the database.
 */

import { supabase } from '@/shared/lib/supabaseClient'
import type { ApiResult, PaginatedResult, DateRange } from '@/shared/types/app.types'
import type { AnalyticsEvent } from '@/shared/types/database.types'

export interface AnalyticsSummary {
  totalEvents: number
  uniqueSessions: number
  uniqueUsers: number
  topPages: Array<{ page: string; views: number }>
  deviceBreakdown: Array<{ device: string; count: number; percentage: number }>
  countryBreakdown: Array<{ country: string; count: number }>
  timeSeriesData: Array<{ date: string; events: number; sessions: number }>
}

// ─── Summary (aggregated via RPC) ─────────────────────────────────────────────

export async function getAnalyticsSummary(
  organizationId: string,
  dateRange: DateRange,
): Promise<ApiResult<AnalyticsSummary>> {
  const { data, error } = await supabase.rpc('get_analytics_summary', {
    org_id: organizationId,
    start_date: dateRange.from.toISOString(),
    end_date: dateRange.to.toISOString(),
  })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  // Transform snake_case RPC response to camelCase
  return {
    data: {
      totalEvents: data.total_events,
      uniqueSessions: data.unique_sessions,
      uniqueUsers: data.unique_users,
      topPages: (data.top_pages as Array<{ page: string; views: number }>) ?? [],
      deviceBreakdown: (data.device_breakdown as Array<{ device: string; count: number; percentage: number }>) ?? [],
      countryBreakdown: (data.country_breakdown as Array<{ country: string; count: number }>) ?? [],
      timeSeriesData: (data.time_series as Array<{ date: string; events: number; sessions: number }>) ?? [],
    },
    error: null,
  }
}

// ─── Events (paginated) ───────────────────────────────────────────────────────

export interface AnalyticsEventsFilter {
  eventType?: string
  deviceType?: AnalyticsEvent['device_type']
  country?: string
  search?: string
}

export async function getAnalyticsEvents(
  organizationId: string,
  page: number,
  pageSize: number,
  filters: AnalyticsEventsFilter,
): Promise<ApiResult<PaginatedResult<AnalyticsEvent>>> {
  let query = supabase
    .from('analytics_events')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (filters.eventType) query = query.eq('event_type', filters.eventType)
  if (filters.deviceType) query = query.eq('device_type', filters.deviceType)
  if (filters.country) query = query.eq('country', filters.country)
  if (filters.search) query = query.ilike('page_url', `%${filters.search}%`)

  const { data, error, count } = await query

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const total = count ?? 0

  return {
    data: {
      data: data ?? [],
      total,
      page,
      pageSize,
      hasNextPage: (page + 1) * pageSize < total,
    },
    error: null,
  }
}