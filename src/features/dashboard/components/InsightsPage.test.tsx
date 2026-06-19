import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { InsightsPage } from './InsightsPage'

const authState = vi.hoisted(() => ({
  profile: null as null | { organization_id: string },
}))

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ profile: authState.profile }),
}))

vi.mock('./InsightsPanel', () => ({
  InsightsPanel: ({ organizationId }: { organizationId: string }) => (
    <div data-testid="insights-panel">{organizationId}</div>
  ),
}))

describe('InsightsPage', () => {
  it('shows the fallback copy while the profile is loading', () => {
    authState.profile = null

    render(<InsightsPage />)

    expect(screen.getByText('AI-generated anomalies, trends, and recommendations from your analytics data')).toBeTruthy()
    expect(screen.getByTestId('insights-panel').textContent).toBe('')
  })

  it('passes the organization id to the insights panel', () => {
    authState.profile = { organization_id: 'org_456' }

    render(<InsightsPage />)

    expect(screen.getByTestId('insights-panel').textContent).toBe('org_456')
  })
})