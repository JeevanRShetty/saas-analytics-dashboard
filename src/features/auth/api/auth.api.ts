/**
 * auth.api.ts
 *
 * All authentication calls live here. Components and hooks never import
 * supabase directly — they call these functions. This means:
 *
 * 1. If Supabase changes their SDK, we update one file
 * 2. Every auth call is easy to mock in tests
 * 3. Error handling is normalized before it reaches the UI layer
 *
 * All functions return ApiResult<T> — callers can assume a consistent shape.
 */

import { supabase } from '@/shared/lib/supabaseClient'
import type { ApiResult } from '@/shared/types/app.types'
import type { Profile } from '@/shared/types/database.types'

// ─── Auth operations ──────────────────────────────────────────────────────────

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<ApiResult<{ userId: string }>> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return {
      data: null,
      error: {
        message: error.message,
        code: error.code ?? 'AUTH_ERROR',
        statusCode: error.status,
      },
    }
  }

  return { data: { userId: data.user.id }, error: null }
}

export async function signInWithMagicLink(email: string): Promise<ApiResult<void>> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code ?? 'AUTH_ERROR' },
    }
  }

  return { data: undefined, error: null }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
): Promise<ApiResult<{ userId: string }>> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code ?? 'SIGNUP_ERROR' },
    }
  }

  if (!data.user) {
    return {
      data: null,
      error: { message: 'Signup failed — no user returned', code: 'SIGNUP_FAILED' },
    }
  }

  return { data: { userId: data.user.id }, error: null }
}

export async function signOut(): Promise<ApiResult<void>> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: 'SIGNOUT_ERROR' },
    }
  }

  return { data: undefined, error: null }
}

export async function resetPassword(email: string): Promise<ApiResult<void>> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  })

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: 'RESET_ERROR' },
    }
  }

  return { data: undefined, error: null }
}

// ─── Profile operations ───────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<ApiResult<Profile>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data, error: null }
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'preferences'>>,
): Promise<ApiResult<Profile>> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    }
  }

  return { data, error: null }
}

// ─── Session helpers ──────────────────────────────────────────────────────────

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function — call it on component cleanup.
 *
 * Usage in React:
 *   useEffect(() => {
 *     const unsubscribe = onAuthStateChange((event, session) => { ... })
 *     return unsubscribe
 *   }, [])
 */
export function onAuthStateChange(
  callback: (event: string, session: Awaited<ReturnType<typeof getSession>>) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return () => data.subscription.unsubscribe()
}