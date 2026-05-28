/**
 * format.ts
 *
 * Pure formatting utilities. Pure = no side effects, no imports from the app.
 * These are the easiest functions to unit test and the most worth testing —
 * formatting bugs are visible to users immediately.
 */

// ─── Numbers ──────────────────────────────────────────────────────────────────

/**
 * Formats a number with compact notation above 1000.
 * 1234 → "1.2K", 1_234_567 → "1.2M"
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

/**
 * Formats a number as a percentage.
 * 0.1234 → "12.3%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Formats a delta with sign and color hint.
 * Returns { formatted: "+12.3%", direction: "up" | "down" | "neutral" }
 */
export function formatDelta(value: number): { formatted: string; direction: 'up' | 'down' | 'neutral' } {
  const formatted = `${value >= 0 ? '+' : ''}${formatPercent(value)}`
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral'
  return { formatted, direction }
}

// ─── Dates ────────────────────────────────────────────────────────────────────

/**
 * Formats a date as a human-readable relative string.
 * Uses Intl.RelativeTimeFormat for locale awareness.
 * "2 hours ago", "3 days ago", "just now"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return rtf.format(-diffMins, 'minute')
  if (diffHours < 24) return rtf.format(-diffHours, 'hour')
  if (diffDays < 30) return rtf.format(-diffDays, 'day')

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

/**
 * Formats a date for display in tables and logs.
 * "Jan 15, 2025, 2:34 PM"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

/**
 * Formats a date for chart axis labels.
 * "Jan 15" or "Jan 15, 2025" depending on year context.
 */
export function formatChartDate(date: Date | string, showYear = false): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(showYear ? { year: 'numeric' } : {}),
  }).format(d)
}

// ─── Strings ──────────────────────────────────────────────────────────────────

/**
 * Truncates a string to maxLength with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 3)}...`
}

/**
 * Converts a slug or snake_case string to Title Case.
 * "user_role_updated" → "User Role Updated"
 */
export function slugToTitle(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Generates initials from a full name.
 * "Sarah Connor" → "SC", "John" → "J"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('')
}