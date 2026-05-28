/**
 * themeStore.ts
 *
 * Manages dark/light/system mode preference.
 *
 * Why persist middleware?
 *   The user's theme choice should survive page refreshes. We use Zustand's
 *   persist middleware to automatically sync this store to localStorage.
 *   On mount, the persisted value is rehydrated before the first render,
 *   preventing the flash-of-wrong-theme problem.
 *
 * Why 'class' strategy vs 'media'?
 *   Tailwind's darkMode: 'class' means dark mode is toggled by adding the
 *   'dark' class to <html>. This gives users explicit control rather than
 *   automatically following the OS preference. We read the OS preference
 *   only for the 'system' mode.
 *
 * The applyTheme function is called:
 *   1. On initial app load (reads persisted preference)
 *   2. On every theme change (user clicks the toggle)
 *   3. When OS preference changes (for 'system' mode users only)
 */

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import type { ThemeMode } from '@/shared/types/app.types'

interface ThemeState {
  mode: ThemeMode
  // resolvedTheme is 'light' | 'dark' — never 'system'
  // It's the actual applied theme after resolving 'system' against OS preference
  resolvedTheme: 'light' | 'dark'
}

interface ThemeActions {
  setTheme: (mode: ThemeMode) => void
}

type ThemeStore = ThemeState & ThemeActions

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return getSystemTheme()
  return mode
}

function applyThemeToDOM(resolved: 'light' | 'dark'): void {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeStore>()(
  devtools(
    persist(
      (set, get) => ({
        mode: 'system',
        resolvedTheme: resolveTheme('system'),

        setTheme: (mode) => {
          const resolvedTheme = resolveTheme(mode)
          applyThemeToDOM(resolvedTheme)
          set({ mode, resolvedTheme }, false, 'setTheme')
        },
      }),
      {
        name: 'theme-preference',
        // Only persist the mode — resolvedTheme is always derived
        partialize: (state) => ({ mode: state.mode }),
        // After rehydration, re-resolve and apply theme to DOM
        onRehydrateStorage: () => (state) => {
          if (state) {
            const resolvedTheme = resolveTheme(state.mode)
            applyThemeToDOM(resolvedTheme)
            state.resolvedTheme = resolvedTheme
          }
        },
      },
    ),
    { name: 'theme-store' },
  ),
)

// Listen for OS theme changes when mode is 'system'
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { mode, setTheme } = useThemeStore.getState()
    if (mode === 'system') {
      setTheme('system')
    }
  })
}