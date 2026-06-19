import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthGuard, GuestGuard } from './AuthGuard'

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
  hasRole: false,
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
  }),
  usePermission: () => authState.hasRole,
}))

function LocationState() {
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? ''

  return <div data-testid="location-state">{`${location.pathname}|${from}`}</div>
}

describe('AuthGuard', () => {
  afterEach(() => {
    authState.isAuthenticated = false
    authState.isLoading = false
    authState.hasRole = false
  })

  it('shows the app skeleton while auth is loading', () => {
    authState.isLoading = true

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/dashboard" element={<div>Protected</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.queryByText('Protected')).toBeNull()
    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  it('redirects unauthenticated users to login and preserves the location', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/analytics']}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/dashboard/analytics" element={<div>Protected</div>} />
          </Route>
          <Route path="/login" element={<LocationState />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('location-state').textContent).toBe('/login|/dashboard/analytics')
  })

  it('redirects authenticated users without the required role to 403', () => {
    authState.isAuthenticated = true
    authState.hasRole = false

    render(
      <MemoryRouter initialEntries={['/dashboard/audit-logs']}>
        <Routes>
          <Route element={<AuthGuard requiredRole="admin" />}>
            <Route path="/dashboard/audit-logs" element={<div>Protected</div>} />
          </Route>
          <Route path="/403" element={<div>Forbidden</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Forbidden')).toBeTruthy()
  })

  it('renders protected content for authenticated users with the required role', () => {
    authState.isAuthenticated = true
    authState.hasRole = true

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/dashboard" element={<div>Protected</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Protected')).toBeTruthy()
  })
})

describe('GuestGuard', () => {
  afterEach(() => {
    authState.isAuthenticated = false
    authState.isLoading = false
    authState.hasRole = false
  })

  it('redirects authenticated users back to their origin when available', () => {
    authState.isAuthenticated = true

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: { from: { pathname: '/dashboard/insights' } },
          },
        ]}
      >
        <Routes>
          <Route element={<GuestGuard />}>
            <Route path="/login" element={<div>Login</div>} />
          </Route>
          <Route path="/dashboard/insights" element={<LocationState />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('location-state').textContent).toBe('/dashboard/insights|')
  })

  it('allows guests to access guest-only routes', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<GuestGuard />}>
            <Route path="/login" element={<div>Login</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login')).toBeTruthy()
  })
})