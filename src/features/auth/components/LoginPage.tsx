/**
 * LoginPage.tsx
 *
 * Production login page patterns demonstrated here:
 *
 * 1. CONTROLLED FORM STATE without a form library
 *    For a 2-field form, useState is sufficient. Reaching for React Hook Form
 *    or Zod here is overengineering. We add those for complex multi-step forms.
 *
 * 2. OPTIMISTIC DISABLE
 *    The submit button is disabled during submission. Without this, a slow
 *    network causes double-submit bugs — users click again thinking it didn't work.
 *
 * 3. FIELD-LEVEL VS FORM-LEVEL ERRORS
 *    Auth errors (wrong password, user not found) are form-level — they don't
 *    map to a specific field because we don't tell users which field is wrong
 *    (security best practice). Validation errors (empty email) are field-level.
 *
 * 4. REDIRECT PRESERVATION
 *    After login, we send users back to where they tried to go (from AuthGuard).
 */

import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { signInWithEmail } from '../api/auth.api'
import { cn } from '@/shared/utils/cn'

type FormState = {
  email: string
  password: string
}

type FormErrors = {
  email?: string
  password?: string
  form?: string
}

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!values.email) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email'
  if (!values.password) errors.password = 'Password is required'
  else if (values.password.length < 8) errors.password = 'Password must be at least 8 characters'
  return errors
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard'

  const [values, setValues] = useState<FormState>({ email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }))
      // Clear field error on change
      if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationErrors = validate(values)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    const result = await signInWithEmail(values.email, values.password)

    if (result.error) {
      setErrors({ form: result.error.message })
      setIsSubmitting(false)
      return
    }

    // Auth state change listener in useAuth will update the session cache.
    // We just need to navigate — AuthGuard will verify on the new route.
    navigate(from, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-4 py-8 dark:bg-gray-950 sm:items-center sm:py-0">
      <div className="w-full max-w-md space-y-8">
        {/* Logo / Brand */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <span className="text-xl font-bold text-white">A</span>
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5" noValidate>
          {/* Form-level error */}
          {errors.form && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {errors.form}
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange('email')}
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={cn(
                'block w-full rounded-lg border px-3 py-2.5 text-sm transition-colors',
                'bg-white text-gray-900 placeholder:text-gray-400',
                'dark:bg-gray-900 dark:text-gray-50 dark:placeholder:text-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0',
                errors.email
                  ? 'border-red-400 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-700',
              )}
              placeholder="you@company.com"
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange('password')}
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={cn(
                'block w-full rounded-lg border px-3 py-2.5 text-sm transition-colors',
                'bg-white text-gray-900',
                'dark:bg-gray-900 dark:text-gray-50',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0',
                errors.password
                  ? 'border-red-400 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-700',
              )}
              placeholder="••••••••"
            />
            {errors.password && (
              <p id="password-error" className="text-xs text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium',
              'bg-blue-600 text-white transition-colors hover:bg-blue-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}