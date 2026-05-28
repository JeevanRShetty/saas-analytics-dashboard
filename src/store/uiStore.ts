/**
 * uiStore.ts
 *
 * Client state for UI decisions that affect the entire app shell.
 * No server data lives here — only "is this drawer open", "what toast
 * is showing", "is the command palette visible".
 *
 * Design decisions:
 *
 * 1. SEPARATE FROM SERVER STATE
 *    Tempting to put "selected user" or "active organization" here.
 *    Don't. Those are derived from the URL or fetched from the server.
 *    Zustand is for pure UI mechanics.
 *
 * 2. NO DERIVED STATE IN STORE
 *    Zustand stores hold minimal state. Derived values (e.g. "how many
 *    unread toasts are there") are computed in selectors, not stored.
 *    Storing derived state creates synchronization bugs.
 *
 * 3. SHALLOW EQUALITY
 *    When a component subscribes to a slice of the store, it should use
 *    useUIStore(state => state.isSidebarOpen) not useUIStore().
 *    The former only re-renders when isSidebarOpen changes.
 *    The latter re-renders on any store update.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ToastMessage } from '@/shared/types/app.types'

interface UIState {
  // Sidebar
  isSidebarOpen: boolean
  isSidebarCollapsed: boolean

  // Command palette
  isCommandPaletteOpen: boolean

  // Active modal (string ID, null when closed)
  activeModal: string | null
  modalData: Record<string, unknown>

  // Toast notifications (transient UI messages, not persisted notifications)
  toasts: ToastMessage[]
}

interface UIActions {
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void

  openCommandPalette: () => void
  closeCommandPalette: () => void

  openModal: (id: string, data?: Record<string, unknown>) => void
  closeModal: () => void

  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      // Initial state
      isSidebarOpen: true,
      isSidebarCollapsed: false,
      isCommandPaletteOpen: false,
      activeModal: null,
      modalData: {},
      toasts: [],

      // Sidebar
      setSidebarOpen: (open) => set({ isSidebarOpen: open }, false, 'setSidebarOpen'),
      toggleSidebar: () =>
        set((s) => ({ isSidebarOpen: !s.isSidebarOpen }), false, 'toggleSidebar'),
      setSidebarCollapsed: (collapsed) =>
        set({ isSidebarCollapsed: collapsed }, false, 'setSidebarCollapsed'),
      toggleSidebarCollapsed: () =>
        set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed }), false, 'toggleSidebarCollapsed'),

      // Command palette
      openCommandPalette: () => set({ isCommandPaletteOpen: true }, false, 'openCommandPalette'),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }, false, 'closeCommandPalette'),

      // Modal
      openModal: (id, data = {}) =>
        set({ activeModal: id, modalData: data }, false, 'openModal'),
      closeModal: () =>
        set({ activeModal: null, modalData: {} }, false, 'closeModal'),

      // Toasts
      addToast: (toast) =>
        set(
          (s) => ({
            toasts: [
              ...s.toasts,
              { ...toast, id: `toast-${Date.now()}-${Math.random()}` },
            ],
          }),
          false,
          'addToast',
        ),
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }), false, 'removeToast'),
    }),
    { name: 'ui-store' },
  ),
)