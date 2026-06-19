import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AppLayout } from './AppLayout'

const uiState = vi.hoisted(() => ({
  isSidebarCollapsed: false,
}))

vi.mock('@/store/uiStore', () => ({
  useUIStore: (selector: (state: { isSidebarCollapsed: boolean }) => unknown) =>
    selector({ isSidebarCollapsed: uiState.isSidebarCollapsed }),
}))

vi.mock('./Sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar" />,
}))

vi.mock('./Header', () => ({
  Header: () => <header data-testid="header" />,
}))

vi.mock('@/shared/components/ui/Toast', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
}))

describe('AppLayout', () => {
  it('renders the shell and outlet content with the expanded sidebar width', () => {
    uiState.isSidebarCollapsed = false

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<div>Outlet content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('sidebar')).toBeTruthy()
    expect(screen.getByTestId('header')).toBeTruthy()
    expect(screen.getByTestId('toast-container')).toBeTruthy()
    expect(screen.getByText('Outlet content')).toBeTruthy()
  })

  it('switches to the collapsed grid width', () => {
    uiState.isSidebarCollapsed = true

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<div>Outlet content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect((container.firstChild as HTMLElement).className).toContain('64px_1fr')
  })
})