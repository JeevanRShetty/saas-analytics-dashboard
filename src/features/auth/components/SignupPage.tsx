import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUpWithEmail } from '../api/auth.api'
import { cn } from '@/shared/utils/cn'

export function SignupPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await signUpWithEmail(values.email, values.password, values.fullName)

    if (result.error) {
      setError(result.error.message)
      setIsSubmitting(false)
      return
    }

    navigate('/onboarding')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <span className="text-xl font-bold text-white">A</span>
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {(['fullName', 'email', 'password'] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <label htmlFor={field} className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {field === 'fullName' ? 'Full name' : field}
              </label>
              <input
                id={field}
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                value={values[field]}
                onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
                disabled={isSubmitting}
                className={cn(
                  'block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm',
                  'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
                  'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50',
                )}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Create account
          </button>
        </form>
      </div>
    </div>
  )
}