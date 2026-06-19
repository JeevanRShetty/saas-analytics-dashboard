import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signInWithOtp: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}))

const queryMocks = vi.hoisted(() => ({
  single: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
}))

queryMocks.select.mockImplementation(() => queryMocks)
queryMocks.update.mockImplementation(() => queryMocks)
queryMocks.eq.mockImplementation(() => queryMocks)

vi.mock('@/shared/lib/supabaseClient', () => ({
  supabase: {
    auth: authMocks,
    from: () => queryMocks,
  },
}))

describe('auth.api', () => {
  beforeEach(() => {
    authMocks.signInWithPassword.mockReset()
    authMocks.signInWithOtp.mockReset()
    authMocks.signUp.mockReset()
    authMocks.signOut.mockReset()
    authMocks.resetPasswordForEmail.mockReset()
    authMocks.getSession.mockReset()
    authMocks.onAuthStateChange.mockReset()
    queryMocks.single.mockReset()
    queryMocks.select.mockClear()
    queryMocks.update.mockClear()
    queryMocks.eq.mockClear()
  })

  it('normalizes sign-in success and failure', async () => {
    authMocks.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user_1' } },
      error: null,
    })

    const { signInWithEmail } = await import('./auth.api')
    await expect(signInWithEmail('alex@example.com', 'password123')).resolves.toEqual({
      data: { userId: 'user_1' },
      error: null,
    })
    expect(authMocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'alex@example.com',
      password: 'password123',
    })

    authMocks.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials', code: 'INVALID_LOGIN', status: 401 },
    })

    await expect(signInWithEmail('alex@example.com', 'password123')).resolves.toEqual({
      data: null,
      error: {
        message: 'Invalid credentials',
        code: 'INVALID_LOGIN',
        statusCode: 401,
      },
    })
  })

  it('handles signup and session helpers', async () => {
    authMocks.signUp.mockResolvedValue({
      data: { user: { id: 'user_1' } },
      error: null,
    })
    authMocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'user_1' } } }, error: null })
    authMocks.signOut.mockResolvedValue({ error: null })

    const { signUpWithEmail, getSession, signOut, signInWithMagicLink, resetPassword } = await import('./auth.api')

    await expect(signUpWithEmail('alex@example.com', 'password123', 'Alex Doe')).resolves.toEqual({
      data: { userId: 'user_1' },
      error: null,
    })

    authMocks.signUp.mockResolvedValue({ data: { user: null }, error: null })
    await expect(signUpWithEmail('alex@example.com', 'password123', 'Alex Doe')).resolves.toEqual({
      data: null,
      error: { message: 'Signup failed — no user returned', code: 'SIGNUP_FAILED' },
    })

    authMocks.signInWithOtp.mockResolvedValue({ error: null })
    authMocks.resetPasswordForEmail.mockResolvedValue({ error: null })

    await expect(signInWithMagicLink('alex@example.com')).resolves.toEqual({ data: undefined, error: null })
    await expect(resetPassword('alex@example.com')).resolves.toEqual({ data: undefined, error: null })
    await expect(getSession()).resolves.toEqual({ user: { id: 'user_1' } })
    await expect(signOut()).resolves.toEqual({ data: undefined, error: null })
  })

  it('normalizes profile reads and updates', async () => {
    queryMocks.single.mockResolvedValueOnce({
      data: {
        id: 'user_1',
        email: 'alex@example.com',
      },
      error: null,
    })

    const { getProfile, updateProfile, onAuthStateChange } = await import('./auth.api')

    await expect(getProfile('user_1')).resolves.toEqual({
      data: { id: 'user_1', email: 'alex@example.com' },
      error: null,
    })

    queryMocks.single.mockResolvedValueOnce({
      data: { id: 'user_1', full_name: 'Alex Doe' },
      error: null,
    })

    await expect(updateProfile('user_1', { full_name: 'Alex Doe' })).resolves.toMatchObject({
      data: { id: 'user_1', full_name: 'Alex Doe' },
      error: null,
    })

    const unsubscribe = vi.fn()
    let callback: ((event: string, session: unknown) => void) | null = null
    authMocks.onAuthStateChange.mockImplementation((cb) => {
      callback = cb
      return { data: { subscription: { unsubscribe } } }
    })

    const cleanup = onAuthStateChange(() => undefined)
    expect(typeof callback).toBe('function')
    callback?.('SIGNED_OUT', null)
    cleanup()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})