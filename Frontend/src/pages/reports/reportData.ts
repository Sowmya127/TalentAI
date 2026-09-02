import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboardApi'
import type { FunnelDatum } from '@/components/common/FunnelChart'
import type { RecruitmentFunnel } from '@/types/dashboard'

export function funnelToData(f: RecruitmentFunnel): FunnelDatum[] {
  return [
    { stage: 'Applied', value: f.applied },
    { stage: 'Screened', value: f.screened },
    { stage: 'Shortlisted', value: f.shortlisted },
    { stage: 'Interviewed', value: f.interviewed },
    { stage: 'Offered', value: f.offered },
    { stage: 'Hired', value: f.hired },
  ]
}

export function useDashboardSummary() {
  return useQuery({ queryKey: ['dashboardSummary'], queryFn: dashboardApi.summary })
}
export function useHiringMetrics() {
  return useQuery({ queryKey: ['dashboardMetrics'], queryFn: dashboardApi.metrics })
}
export function useRecruitmentFunnel() {
  return useQuery({ queryKey: ['dashboardFunnel'], queryFn: () => dashboardApi.funnel() })
}
