import { describe, expect, it } from 'vitest'

import { useUIStore } from './uiStore'

describe('uiStore', () => {
  it('toggles sidebar state and modal state', () => {
    useUIStore.getState().setSidebarOpen(false)
    expect(useUIStore.getState().isSidebarOpen).toBe(false)

    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().isSidebarOpen).toBe(true)

    useUIStore.getState().setSidebarCollapsed(true)
    expect(useUIStore.getState().isSidebarCollapsed).toBe(true)

    useUIStore.getState().toggleSidebarCollapsed()
    expect(useUIStore.getState().isSidebarCollapsed).toBe(false)

    useUIStore.getState().openModal('settings', { tab: 'profile' })
    expect(useUIStore.getState().activeModal).toBe('settings')
    expect(useUIStore.getState().modalData).toEqual({ tab: 'profile' })

    useUIStore.getState().closeModal()
    expect(useUIStore.getState().activeModal).toBeNull()
    expect(useUIStore.getState().modalData).toEqual({})
  })

  it('adds and removes toasts', () => {
    const originalNow = Date.now
    const originalRandom = Math.random
    try {
      Date.now = () => 1234567890
      Math.random = () => 0.42

      useUIStore.setState({ toasts: [] })

      useUIStore.getState().addToast({
        title: 'Saved',
        message: 'Preferences updated',
        variant: 'success',
      })

      expect(useUIStore.getState().toasts).toEqual([
        {
          id: 'toast-1234567890-0.42',
          title: 'Saved',
          message: 'Preferences updated',
          variant: 'success',
        },
      ])

      useUIStore.getState().removeToast('toast-1234567890-0.42')
      expect(useUIStore.getState().toasts).toEqual([])
    } finally {
      Date.now = originalNow
      Math.random = originalRandom
    }
  })
})