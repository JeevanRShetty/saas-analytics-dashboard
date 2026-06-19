import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Sidebar } from './Sidebar'

const uiState = vi.hoisted(() => ({
  isSidebarCollapsed: false,
  toggleSidebarCollapsed: vi.fn(),
}))

const authState = vi.hoisted(() => ({
  profile: {
    id: 'profile_1',
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    email: 'owner@example.com',
    full_name: 'Owner User',
    avatar_url: null,
    role: 'owner' as const,
    organization_id: 'org_1',
    onboarding_completed: true,
    preferences: {},
  },
}))

vi.mock('@/store/uiStore', () => ({
  useUIStore: (selector: (state: { isSidebarCollapsed: boolean; toggleSidebarCollapsed: () => void }) => unknown) =>
    selector({
      isSidebarCollapsed: uiState.isSidebarCollapsed,
      toggleSidebarCollapsed: uiState.toggleSidebarCollapsed,
    }),
}))

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ profile: authState.profile }),
}))

describe('Sidebar', () => {
  it('shows owner-only navigation and expands/collapses', () => {
    uiState.isSidebarCollapsed = false
    uiState.toggleSidebarCollapsed.mockClear()

    const { rerender } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>,
    )

    expect(screen.getByText('Dashboard')).toBeTruthy()
    expect(screen.getByText('AI Insights')).toBeTruthy()
    expect(screen.getByText('Organization')).toBeTruthy()
    expect(screen.getByText('Owner User')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Collapse sidebar'))
    expect(uiState.toggleSidebarCollapsed).toHaveBeenCalledTimes(1)

    uiState.isSidebarCollapsed = true
    rerender(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Owner User')).toBeNull()
    expect(screen.getByLabelText('Expand sidebar')).toBeTruthy()
  })

  it('hides admin navigation for lower roles', () => {
    authState.profile = {
      ...authState.profile,
      role: 'member',
    }
    uiState.isSidebarCollapsed = false

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Audit Logs')).toBeNull()
    expect(screen.queryByText('Team')).toBeNull()
    expect(screen.queryByText('Organization')).toBeNull()
    expect(screen.getByText('Settings')).toBeTruthy()
  })
})