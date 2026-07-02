import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AppShellSkeleton } from '@/shared/components/ui/Skeleton'

describe('AppShellSkeleton', () => {
  it('renders the full shell skeleton', () => {
    const { container } = render(<AppShellSkeleton />)

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(container.querySelector('.flex.w-full.flex-col')).toBeTruthy()
  })

  it('renders the minimal loader variant', () => {
    const { container } = render(<AppShellSkeleton minimal />)

    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })
})