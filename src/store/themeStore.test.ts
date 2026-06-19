import { describe, expect, it, beforeEach, vi } from 'vitest'

const matchMediaMock = vi.fn()

function setMatchMedia(matches: boolean) {
  matchMediaMock.mockImplementation(() => ({
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  Object.defineProperty(window, 'matchMedia', {
    value: matchMediaMock,
    configurable: true,
  })
}

describe('themeStore', () => {
  beforeEach(async () => {
    vi.resetModules()
    window.localStorage.clear()
    document.documentElement.className = ''
  })

  it('applies dark and light themes to the document element', async () => {
    setMatchMedia(true)

    const { useThemeStore } = await import('./themeStore')

    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().mode).toBe('dark')
    expect(useThemeStore.getState().resolvedTheme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    useThemeStore.getState().setTheme('light')
    expect(useThemeStore.getState().mode).toBe('light')
    expect(useThemeStore.getState().resolvedTheme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('resolves system theme based on matchMedia', async () => {
    setMatchMedia(false)

    const { useThemeStore } = await import('./themeStore')

    useThemeStore.getState().setTheme('system')
    expect(useThemeStore.getState().mode).toBe('system')
    expect(useThemeStore.getState().resolvedTheme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})