import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LoginPage } from './LoginPage'

const navigateMock = vi.hoisted(() => vi.fn())
const locationState = vi.hoisted(() => ({
  location: { state: null as null | { from?: { pathname: string } } },
}))
const signInMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => locationState.location as ReturnType<typeof actual.useLocation>,
  }
})

vi.mock('../api/auth.api', () => ({
  signInWithEmail: (...args: unknown[]) => signInMock(...args),
}))

describe('LoginPage', () => {
  it('shows validation errors and blocks submission with invalid input', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.getByText('Email is required')).toBeTruthy()
    expect(screen.getByText('Password is required')).toBeTruthy()
    expect(signInMock).not.toHaveBeenCalled()
  })

  it('submits credentials and navigates back to the original route', async () => {
    locationState.location = { state: { from: { pathname: '/dashboard/analytics' } } }
    signInMock.mockResolvedValue({ data: { userId: 'user_1' }, error: null })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'alex@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('alex@example.com', 'password123')
    })
    expect(navigateMock).toHaveBeenCalledWith('/dashboard/analytics', { replace: true })
  })
})