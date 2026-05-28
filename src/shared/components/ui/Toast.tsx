/**
 * Toast.tsx
 *
 * A lightweight toast system built on our Zustand UI store.
 *
 * Architecture: Instead of a third-party library (react-hot-toast, sonner),
 * we build a minimal version. For a portfolio project this demonstrates you
 * understand the mechanism. In production you'd use sonner — it handles
 * accessibility, stacking animations, and keyboard dismissal properly.
 *
 * The ToastContainer component is rendered once in AppLayout.
 * Components trigger toasts via the useUIStore.addToast() action.
 */

import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/shared/utils/cn'
import type { ToastMessage } from '@/shared/types/app.types'

const TOAST_ICONS: Record<ToastMessage['type'], string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'i',
}

const TOAST_STYLES: Record<ToastMessage['type'], string> = {
  success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
}

const ICON_STYLES: Record<ToastMessage['type'], string> = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
}

function ToastItem({ toast }: { toast: ToastMessage }) {
  const removeToast = useUIStore((s) => s.removeToast)
  const duration = toast.duration ?? 4000

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast.id, duration, removeToast])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 shadow-lg',
        'animate-in slide-in-from-right-full duration-300',
        TOAST_STYLES[toast.type],
      )}
    >
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          ICON_STYLES[toast.type],
        )}
        aria-hidden="true"
      >
        {TOAST_ICONS[toast.type]}
      </span>
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && (
          <p className="text-xs opacity-80">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <span className="text-lg leading-none">×</span>
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

// ─── useToast hook ────────────────────────────────────────────────────────────
// Convenience hook so components don't import from the store directly

export function useToast() {
  const addToast = useUIStore((s) => s.addToast)

  return {
    toast: addToast,
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
  }
}