import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AuthLayout } from './AuthLayout'

describe('AuthLayout', () => {
  it('renders its outlet inside the guest shell', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<div>Login content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login content')).toBeTruthy()
    expect((container.firstChild as HTMLElement).className).toContain('bg-gray-50')
  })
})