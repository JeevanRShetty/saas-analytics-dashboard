/**
 * filtersStore.ts
 *
 * Manages active filters for the analytics dashboard.
 *
 * Important design note: For filters that should be shareable via URL
 * (e.g. user bookmarks a specific date range view and shares it),
 * consider syncing this state with URL search params using a hook.
 * We track the local state here and provide a URL-sync hook separately.
 *
 * Why Zustand and not URL params directly?
 *   URL params are the source of truth for shareable filter state,
 *   but reading/writing them on every render creates friction.
 *   We use this store as a fast read layer and sync to URL as a
 *   side effect. The useDashboardFilters hook (in features/dashboard)
 *   composes both concerns.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { DateRange, DateRangePreset } from '@/shared/types/app.types'

interface FiltersState {
  dateRangePreset: DateRangePreset
  dateRange: DateRange
  segment: string | null
  deviceType: 'all' | 'desktop' | 'mobile' | 'tablet'
  country: string | null
  compareEnabled: boolean
}

interface FiltersActions {
  setDateRangePreset: (preset: DateRangePreset) => void
  setDateRange: (range: DateRange) => void
  setSegment: (segment: string | null) => void
  setDeviceType: (deviceType: FiltersState['deviceType']) => void
  setCountry: (country: string | null) => void
  toggleCompare: () => void
  resetFilters: () => void
}

const defaultDateRange = (): DateRange => {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return { from, to }
}

const initialState: FiltersState = {
  dateRangePreset: '30d',
  dateRange: defaultDateRange(),
  segment: null,
  deviceType: 'all',
  country: null,
  compareEnabled: false,
}

export const useFiltersStore = create<FiltersState & FiltersActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setDateRangePreset: (preset) => {
        const to = new Date()
        const from = new Date()
        const days: Record<Exclude<DateRangePreset, 'custom'>, number> = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365,
        }
        if (preset !== 'custom') {
          from.setDate(from.getDate() - days[preset])
          set({ dateRangePreset: preset, dateRange: { from, to } }, false, 'setDateRangePreset')
        } else {
          set({ dateRangePreset: 'custom' }, false, 'setDateRangePreset')
        }
      },

      setDateRange: (range) =>
        set({ dateRange: range, dateRangePreset: 'custom' }, false, 'setDateRange'),

      setSegment: (segment) => set({ segment }, false, 'setSegment'),

      setDeviceType: (deviceType) => set({ deviceType }, false, 'setDeviceType'),

      setCountry: (country) => set({ country }, false, 'setCountry'),

      toggleCompare: () =>
        set((s) => ({ compareEnabled: !s.compareEnabled }), false, 'toggleCompare'),

      resetFilters: () => set(initialState, false, 'resetFilters'),
    }),
    { name: 'filters-store' },
  ),
)