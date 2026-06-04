import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { queryKeys } from '@/shared/lib/queryClient'
import { cn } from '@/shared/utils/cn'
import { Check } from 'lucide-react'

interface OnboardingState {
  fullName: string
  organizationName: string
  inviteEmails: string[]
}

async function completeOnboarding(
  userId: string,
  orgId: string,
  state: OnboardingState,
): Promise<void> {
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: state.fullName,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (profileError) throw new Error(profileError.message)

  if (state.organizationName) {
    await supabase
      .from('organizations')
      .update({ name: state.organizationName })
      .eq('id', orgId)
  }
}

const STEPS = ['Your profile', 'Organization', 'Invite team'] as const

export function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, profile } = useAuth()

  const [step, setStep] = useState(0)
  const [state, setState] = useState<OnboardingState>({
    fullName: profile?.full_name ?? '',
    organizationName: '',
    inviteEmails: [],
  })

  const { mutate: finish, isPending, error } = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('No user')
      if (!profile?.organization_id) throw new Error('No organization')
      return completeOnboarding(user.id, profile.organization_id, state)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.auth.profile(user!.id),
      })
      navigate('/dashboard', { replace: true })
    },
  })

  function handleNext() {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else finish()
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1))
  }

  // Wait for profile to load before allowing completion
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <span className="text-base font-bold text-white">A</span>
          </div>
        </div>

        <nav aria-label="Onboarding progress" className="mb-8">
          <ol className="flex items-center justify-center gap-3">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                      i < step
                        ? 'bg-blue-600 text-white'
                        : i === step
                        ? 'border-2 border-blue-600 text-blue-600'
                        : 'border-2 border-gray-200 text-gray-400 dark:border-gray-700',
                    )}
                    aria-current={i === step ? 'step' : undefined}
                  >
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      'hidden text-xs font-medium sm:block',
                      i === step ? 'text-gray-900 dark:text-gray-50' : 'text-gray-400',
                    )}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('h-px w-8 transition-colors', i < step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700')} />
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error.message}
            </div>
          )}

          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Set up your profile</h2>
                <p className="mt-1 text-sm text-gray-500">How should teammates see you?</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full name</label>
                <input
                  id="fullName"
                  type="text"
                  autoFocus
                  value={state.fullName}
                  onChange={(e) => setState((s) => ({ ...s, fullName: e.target.value }))}
                  placeholder="Sarah Connor"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Name your organization</h2>
                <p className="mt-1 text-sm text-gray-500">This is how your workspace will appear to teammates.</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organization name</label>
                <input
                  id="orgName"
                  type="text"
                  autoFocus
                  value={state.organizationName}
                  onChange={(e) => setState((s) => ({ ...s, organizationName: e.target.value }))}
                  placeholder="Acme Corp"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <InviteStep
              values={{ inviteEmails: state.inviteEmails }}
              onChange={(v) => setState((s) => ({ ...s, ...v }))}
            />
          )}

          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="text-sm text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-0"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={isPending}
              className={cn(
                'flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium',
                'bg-blue-600 text-white transition-colors hover:bg-blue-700',
                'disabled:cursor-not-allowed disabled:opacity-60',
              )}
            >
              {isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : step === STEPS.length - 1 ? (
                'Complete setup'
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>

        {step === 2 && (
          <button
            onClick={() => finish()}
            className="mt-4 block w-full text-center text-xs text-gray-400 hover:text-gray-600"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}

function InviteStep({
  values,
  onChange,
}: {
  values: { inviteEmails: string[] }
  onChange: (v: { inviteEmails: string[] }) => void
}) {
  const [input, setInput] = useState('')

  function addEmail() {
    const trimmed = input.trim()
    if (trimmed && !values.inviteEmails.includes(trimmed)) {
      onChange({ inviteEmails: [...values.inviteEmails, trimmed] })
      setInput('')
    }
  }

  function removeEmail(email: string) {
    onChange({ inviteEmails: values.inviteEmails.filter((e) => e !== email) })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Invite your team</h2>
        <p className="mt-1 text-sm text-gray-500">Add teammates now or do it later from Settings.</p>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addEmail()}
          placeholder="colleague@company.com"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
        />
        <button
          onClick={addEmail}
          className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
        >
          Add
        </button>
      </div>
      {values.inviteEmails.length > 0 && (
        <ul className="space-y-1.5">
          {values.inviteEmails.map((email) => (
            <li key={email} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
              <span className="text-gray-700 dark:text-gray-300">{email}</span>
              <button onClick={() => removeEmail(email)} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
