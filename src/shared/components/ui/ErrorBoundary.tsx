/**
 * ErrorBoundary.tsx
 *
 * Error boundaries catch JavaScript errors in the component tree and
 * display a fallback UI instead of crashing the entire app.
 *
 * Why a class component?
 *   As of React 18, error boundaries MUST be class components.
 *   There's no hook equivalent for componentDidCatch. This is one of the
 *   few remaining valid reasons to write a class component in modern React.
 *   Libraries like 'react-error-boundary' wrap this for you, but understanding
 *   what they do matters.
 *
 * Where to place error boundaries:
 *   - Route level: each major page is wrapped, crash in Analytics ≠ crash in Dashboard
 *   - Feature level: individual panels/widgets can have their own boundaries
 *   - Don't wrap every tiny component — that's overengineering
 *
 * The retry mechanism:
 *   We increment a reset key, which causes the boundary to re-mount its
 *   children, effectively retrying the failed render. This is the correct
 *   pattern — not remounting the entire boundary component.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  resetKey: number
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, resetKey: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, send to error monitoring (Sentry, Datadog, etc.)
    console.error('ErrorBoundary caught:', error, info)
    this.props.onError?.(error, info)
  }

  handleReset = () => {
    this.setState((s) => ({
      hasError: false,
      error: null,
      resetKey: s.resetKey + 1,
    }))
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onRetry={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

// ─── Default fallback UI ──────────────────────────────────────────────────────

interface DefaultErrorFallbackProps {
  error: Error | null
  onRetry?: () => void
}

function DefaultErrorFallback({ error, onRetry }: DefaultErrorFallbackProps) {
  const isDev = import.meta.env.DEV

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <span className="text-2xl">⚠️</span>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
          Something went wrong
        </h3>
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          This section failed to load. Your other work is unaffected.
        </p>
        {isDev && error && (
          <pre className="mt-3 max-w-md overflow-auto rounded bg-red-100 p-2 text-left text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error.message}
          </pre>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  )
}

// ─── Route-level error boundary ───────────────────────────────────────────────
// A convenience wrapper for wrapping entire pages

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen items-start justify-center px-4 py-8 sm:items-center sm:py-0">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Page failed to load
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Try refreshing the page. If the problem persists, contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Refresh page
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}