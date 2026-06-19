import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SignupPage } from './SignupPage'

const navigateMock = vi.hoisted(() => vi.fn())
const signUpMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../api/auth.api', () => ({
  signUpWithEmail: (...args: unknown[]) => signUpMock(...args),
}))

describe('SignupPage', () => {
  it('shows a signup error when the API fails', async () => {
    signUpMock.mockResolvedValue({ data: null, error: { message: 'Email already exists', code: 'SIGNUP_ERROR' } })

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Alex Doe' } })
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'alex@example.com' } })
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeTruthy()
    })
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('navigates to onboarding on success', async () => {
    signUpMock.mockResolvedValue({ data: { userId: 'user_1' }, error: null })

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Alex Doe' } })
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'alex@example.com' } })
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith('alex@example.com', 'password123', 'Alex Doe')
    })
    expect(navigateMock).toHaveBeenCalledWith('/onboarding')
  })
})