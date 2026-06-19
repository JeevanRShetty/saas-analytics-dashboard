import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Header } from './Header'

const themeState = vi.hoisted(() => ({
  mode: 'light' as 'light' | 'dark' | 'system',
  setTheme: vi.fn(),
}))

const uiState = vi.hoisted(() => ({
  openCommandPalette: vi.fn(),
}))

const authState = vi.hoisted(() => ({
  user: { id: 'user_1' },
  signOut: vi.fn(),
}))

const notificationState = vi.hoisted(() => ({
  count: 3,
}))

vi.mock('@/store/themeStore', () => ({
  useThemeStore: () => ({ mode: themeState.mode, setTheme: themeState.setTheme }),
}))

vi.mock('@/store/uiStore', () => ({
  useUIStore: (selector: (state: { openCommandPalette: () => void }) => unknown) =>
    selector({ openCommandPalette: uiState.openCommandPalette }),
}))

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: authState.user, signOut: authState.signOut }),
}))

vi.mock('@/features/notifications/hooks/useNotifications', () => ({
  useNotificationCount: () => ({ data: notificationState.count }),
}))

describe('Header', () => {
  it('opens the search palette, cycles the theme, and signs out', () => {
    render(<Header />)

    expect(screen.getByLabelText('Notifications, 3 unread')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Open search'))
    expect(uiState.openCommandPalette).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByLabelText('Current theme: light. Click to change.'))
    expect(themeState.setTheme).toHaveBeenCalledWith('dark')

    fireEvent.click(screen.getByLabelText('Sign out'))
    expect(authState.signOut).toHaveBeenCalledTimes(1)
  })
})