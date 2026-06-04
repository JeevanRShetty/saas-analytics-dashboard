/**
 * useDebounce.ts
 *
 * Returns a value that only updates after `delay` ms of no changes.
 * Essential for search inputs — prevents firing a network request
 * on every single keystroke.
 *
 * The cleanup function in useEffect cancels the timeout when:
 *   - The value changes (restarts the timer)
 *   - The component unmounts (prevents state update on dead component)
 *
 * Usage:
 *   const [input, setInput] = useState('')
 *   const debounced = useDebounce(input, 400)
 *   // Use debounced in query keys, not input
 */

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}