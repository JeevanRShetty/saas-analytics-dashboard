import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn — conditional className builder with Tailwind conflict resolution.
 *
 * Why this exists:
 *   Tailwind generates utility classes. When you conditionally apply classes,
 *   naive string concatenation can produce conflicting utilities:
 *     "px-2 px-4"  → both apply, last one wins, but it's unpredictable.
 *
 *   twMerge resolves Tailwind conflicts intelligently. clsx handles the
 *   conditional logic (objects, arrays, falsy filtering).
 *
 * Usage:
 *   cn('base-class', isActive && 'active-class', { 'another-class': condition })
 *   cn('p-2', className)  // allow consumers to extend/override
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}