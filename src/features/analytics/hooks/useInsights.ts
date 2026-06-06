import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabaseClient'
import { queryKeys } from '@/shared/lib/queryClient'
import type { AiInsight } from '@/shared/types/database.types'

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

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

export function useInsights(organizationId: string) {
  return useQuery({
    queryKey: queryKeys.insights.list(organizationId),
    queryFn: () => fetchInsights(organizationId),
    staleTime: 1000 * 60 * 15,
    enabled: isValidUUID(organizationId),
  })
}

export function useAcknowledgeInsight(organizationId: string) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.insights.list(organizationId)

  return useMutation({
    mutationFn: acknowledgeInsight,
    onMutate: async (insightId) => {
      await queryClient.cancelQueries({ queryKey })
      const snapshot = queryClient.getQueryData<AiInsight[]>(queryKey)
      queryClient.setQueryData<AiInsight[]>(queryKey, (old) =>
        old?.map((insight) =>
          insight.id === insightId ? { ...insight, acknowledged: true } : insight,
        ) ?? [],
      )
      return { snapshot }
    },
    onError: (_err, _insightId, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(queryKey, context.snapshot)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
    },
  })
}
