import { describe, expect, it, vi } from 'vitest'

import {
  formatChartDate,
  formatCompactNumber,
  formatDateTime,
  formatDelta,
  formatPercent,
  formatRelativeTime,
  getInitials,
  slugToTitle,
  truncate,
} from './format'

describe('format utilities', () => {
  it('formats compact numbers and percentages', () => {
    expect(formatCompactNumber(1234)).toBe('1.2K')
    expect(formatPercent(0.1234)).toBe('12.3%')
  })

  it('formats deltas with direction', () => {
    expect(formatDelta(0.125)).toEqual({ formatted: '+12.5%', direction: 'up' })
    expect(formatDelta(-0.125)).toEqual({ formatted: '-12.5%', direction: 'down' })
    expect(formatDelta(0)).toEqual({ formatted: '+0.0%', direction: 'neutral' })
  })

  it('formats dates and relative times', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))

    expect(formatRelativeTime(new Date('2025-01-15T11:59:40Z'))).toBe('just now')
    expect(formatRelativeTime(new Date('2025-01-15T11:00:00Z'))).toBe('1 hour ago')
    expect(formatRelativeTime(new Date('2024-12-01T12:00:00Z'))).toBe('Dec 1, 2024')
    expect(formatDateTime(new Date('2025-01-15T14:34:00Z'))).toMatch(/^Jan 15, 2025, \d{1,2}:\d{2} [AP]M$/)
    expect(formatChartDate(new Date('2025-01-15T00:00:00Z'))).toBe('Jan 15')
    expect(formatChartDate(new Date('2025-01-15T00:00:00Z'), true)).toBe('Jan 15, 2025')

    vi.useRealTimers()
  })

  it('formats strings', () => {
    expect(truncate('analytics', 5)).toBe('an...')
    expect(slugToTitle('user_role_updated')).toBe('User Role Updated')
    expect(getInitials('Sarah Connor')).toBe('SC')
  })
})