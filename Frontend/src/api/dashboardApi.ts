import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type { DashboardSummary, HiringMetrics, RecruitmentFunnel, TimeToHire } from '@/types/dashboard'

export const dashboardApi = {
  summary: () => axiosClient.get<DashboardSummary>(ENDPOINTS.dashboard.summary).then((res) => res.data),

  metrics: () => axiosClient.get<HiringMetrics>(ENDPOINTS.dashboard.metrics).then((res) => res.data),

  funnel: (jobId?: number) =>
    axiosClient
      .get<RecruitmentFunnel>(ENDPOINTS.dashboard.funnel, { params: jobId ? { jobId } : undefined })
      .then((res) => res.data),

  timeToHire: (params?: { department?: string; period?: string }) =>
    axiosClient.get<TimeToHire>(ENDPOINTS.dashboard.timeToHire, { params }).then((res) => res.data),
}
