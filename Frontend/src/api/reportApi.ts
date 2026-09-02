import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type { GeneratedReport, ReportFormat } from '@/types/report'

/**
 * /reports/candidates (and /reports/jobs, /recruiters, /interviews, /offers —
 * identical pattern per the API spec) return a generated report descriptor
 * with a downloadUrl, not the file itself.
 */
export const reportApi = {
  candidates: (format: ReportFormat) =>
    axiosClient
      .get<GeneratedReport>(ENDPOINTS.reports.candidates, { params: { format } })
      .then((res) => res.data),

  jobs: (format: ReportFormat) =>
    axiosClient.get<GeneratedReport>(ENDPOINTS.reports.jobs, { params: { format } }).then((res) => res.data),
}
