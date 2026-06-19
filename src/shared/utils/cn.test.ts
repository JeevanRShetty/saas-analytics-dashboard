import { describe, expect, it } from 'vitest'

import { cn } from './cn'

describe('cn', () => {
  it('merges conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4', 'text-sm')).toBe('px-4 text-sm')
  })

  it('filters falsy values and handles conditional objects', () => {
    expect(cn('base', false, null, undefined, { active: true, hidden: false })).toBe('base active')
  })
})