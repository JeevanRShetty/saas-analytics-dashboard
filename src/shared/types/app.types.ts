/**
 * app.types.ts
 *
 * Global types that don't belong to any single feature.
 * Keep this file lean — if a type is only used in one feature, it lives in
 * that feature's types.ts file, not here.
 */

// ─── API response wrapper ─────────────────────────────────────────────────────
// Every API call returns one of these shapes. Having a consistent envelope
// means error handling is uniform across the entire codebase.

export type ApiSuccess<T> = {
  data: T
  error: null
}

export type ApiError = {
  data: null
  error: {
    message: string
    code: string
    statusCode?: number
  }
}

export type ApiResult<T> = ApiSuccess<T> | ApiError

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

// ─── Date range ───────────────────────────────────────────────────────────────

export interface DateRange {
  from: Date
  to: Date
}

export type DateRangePreset = '7d' | '30d' | '90d' | '1y' | 'custom'

// ─── Sort ─────────────────────────────────────────────────────────────────────

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface FilterConfig {
  key: string
  value: string | string[] | number | boolean | null
  operator: 'eq' | 'neq' | 'in' | 'contains' | 'gte' | 'lte'
}

// ─── UI state types ───────────────────────────────────────────────────────────

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

// ─── Permission types ─────────────────────────────────────────────────────────

export interface PermissionContext {
  organizationId: string
  userId: string
  role: import('./database.types').UserRole
  plan: import('./database.types').OrgPlan
}