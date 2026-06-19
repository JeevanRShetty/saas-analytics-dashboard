import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FilterBar } from './FilterBar'

const storeState = vi.hoisted(() => ({
  dateRangePreset: '30d' as '7d' | '30d' | '90d' | '1y',
  setDateRangePreset: vi.fn(),
}))

vi.mock('@/store/filtersStore', () => ({
  useFiltersStore: () => ({
    dateRangePreset: storeState.dateRangePreset,
    setDateRangePreset: storeState.setDateRangePreset,
  }),
}))

describe('FilterBar', () => {
  it('shows the active preset and updates the store on click', () => {
    render(<FilterBar />)

    expect(screen.getByRole('button', { name: '30d' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: '7d' }).getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(screen.getByRole('button', { name: '7d' }))

    expect(storeState.setDateRangePreset).toHaveBeenCalledWith('7d')
  })
})