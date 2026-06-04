/**
 * insights.api.ts + useInsights.ts
 *
 * AI insights are pre-generated server-side (via a Supabase Edge Function
 * that calls OpenAI and stores results in ai_insights table).
 * We don't call the AI API from the browser — that would expose your API
 * key. The pattern is: Edge Function runs on a schedule or webhook trigger,
 * writes insights to the DB, browser reads them via React Query.
 *
 * Mutation: acknowledging an insight uses optimistic update —
 * the UI marks it read instantly, then confirms or rolls back.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { queryKeys } from '@/shared/lib/queryClient'
import type { AiInsight } from '@/shared/types/database.types'

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchInsights(organizationId: string): Promise<AiInsight[]> {
  const { data, error } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw new Error(error.message)
  return data ?? []
}

async function acknowledgeInsight(insightId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_insights')
    .update({ acknowledged: true })
    .eq('id', insightId)

  if (error) throw new Error(error.message)
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useInsights(organizationId: string) {
  return useQuery({
    queryKey: queryKeys.insights.list(organizationId),
    queryFn: () => fetchInsights(organizationId),
    staleTime: 1000 * 60 * 15, // 15 min — AI insights are expensive to generate
    enabled: !!organizationId,
  })
}

export function useAcknowledgeInsight(organizationId: string) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.insights.list(organizationId)

  return useMutation({
    mutationFn: acknowledgeInsight,

    /**
     * OPTIMISTIC UPDATE
     *
     * When the user clicks "Acknowledge", we:
     * 1. Immediately update the cache (UI responds instantly)
     * 2. Fire the API call in the background
     * 3. On error: roll back to the snapshot we saved in onMutate
     * 4. On settle: invalidate to ensure cache matches server truth
     *
     * This is the correct production pattern. Users see instant feedback.
     * If the server call fails (rare), the UI silently reverts.
     */
    onMutate: async (insightId) => {
      // Cancel any in-flight refetches that would overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey })

      // Snapshot current state for rollback
      const snapshot = queryClient.getQueryData<AiInsight[]>(queryKey)

      // Optimistically update
      queryClient.setQueryData<AiInsight[]>(queryKey, (old) =>
        old?.map((insight) =>
          insight.id === insightId ? { ...insight, acknowledged: true } : insight,
        ) ?? [],
      )

      return { snapshot }
    },

    onError: (_err, _insightId, context) => {
      // Roll back on error
      if (context?.snapshot) {
        queryClient.setQueryData(queryKey, context.snapshot)
      }
    },

    onSettled: () => {
      // Always re-sync with server after mutation settles
      void queryClient.invalidateQueries({ queryKey })
    },
  })
}