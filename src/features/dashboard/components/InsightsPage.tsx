import { useAuth } from '@/features/auth/hooks/useAuth'
import { InsightsPanel } from './InsightsPanel'

export function InsightsPage() {
  const { profile } = useAuth()
  const orgId = profile?.organization_id ?? ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">AI Insights</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          AI-generated anomalies, trends, and recommendations from your analytics data
        </p>
      </div>
      <InsightsPanel organizationId={orgId} />
    </div>
  )
}