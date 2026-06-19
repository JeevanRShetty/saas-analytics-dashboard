import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { OnboardingPage } from './OnboardingPage'

const navigateMock = vi.hoisted(() => vi.fn())
const invalidateQueriesMock = vi.hoisted(() => vi.fn())
const mutateMock = vi.hoisted(() => vi.fn())

const authState = vi.hoisted(() => ({
  user: null as null | { id: string },
  profile: null as null | { organization_id: string; full_name: string | null },
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: authState.user, profile: authState.profile }),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()

  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
    useMutation: (options: {
      mutationFn: () => Promise<void>
      onSuccess?: () => void
    }) => ({
      mutate: () => {
        mutateMock()
        void options.mutationFn().then(() => options.onSuccess?.())
      },
      isPending: false,
      error: null,
    }),
  }
})

vi.mock('@/shared/lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}))

describe('OnboardingPage', () => {
  it('shows a loading spinner until the profile is available', () => {
    authState.user = { id: 'user_1' }
    authState.profile = null

    const { container } = render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    )

    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })

  it('walks through the steps and completes onboarding', async () => {
    authState.user = { id: 'user_1' }
    authState.profile = { organization_id: 'org_1', full_name: 'Alex Doe' }
    mutateMock.mockClear()
    navigateMock.mockClear()
    invalidateQueriesMock.mockClear()

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Set up your profile')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Name your organization')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Invite your team')).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('colleague@company.com'), {
      target: { value: 'teammate@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('teammate@example.com')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Complete setup' }))

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(invalidateQueriesMock).toHaveBeenCalled()
      expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })
})