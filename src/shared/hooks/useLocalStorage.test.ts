import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('reads an initial value from localStorage when available', () => {
    window.localStorage.setItem('dashboard-theme', JSON.stringify('dark'))

    const { result } = renderHook(() => useLocalStorage('dashboard-theme', 'light'))

    expect(result.current[0]).toBe('dark')
  })

  it('persists updates and removes values', () => {
    const { result } = renderHook(() => useLocalStorage('sidebar-collapsed', false))

    act(() => {
      result.current[1](true)
    })

    expect(result.current[0]).toBe(true)
    expect(window.localStorage.getItem('sidebar-collapsed')).toBe('true')

    act(() => {
      result.current[2]()
    })

    expect(result.current[0]).toBe(false)
    expect(window.localStorage.getItem('sidebar-collapsed')).toBeNull()
  })

  it('syncs updates from storage events', () => {
    const { result } = renderHook(() => useLocalStorage('theme-mode', 'light'))

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'theme-mode', newValue: JSON.stringify('dark') }))
    })

    expect(result.current[0]).toBe('dark')
  })
})