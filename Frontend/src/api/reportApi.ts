import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type { GeneratedReport, HiringDecisionSummary, ReportFormat } from '@/types/report'

/**
 * /reports/candidates (and /reports/jobs, /recruiters, /interviews, /offers —
 * identical pattern per the API spec) return a generated report descriptor
 * with a downloadUrl, not the file itself. The hiring-decisions report is fully
 * implemented and also offers a real CSV download.
 */
export const reportApi = {
  candidates: (format: ReportFormat) =>
    axiosClient
      .get<GeneratedReport>(ENDPOINTS.reports.candidates, { params: { format } })
      .then((res) => res.data),

  jobs: (format: ReportFormat) =>
    axiosClient.get<GeneratedReport>(ENDPOINTS.reports.jobs, { params: { format } }).then((res) => res.data),

  /** Hiring-manager decision history (selected vs rejected in the last `days` days). */
  hiringDecisions: (days: number) =>
    axiosClient
      .get<HiringDecisionSummary>(ENDPOINTS.reports.hiringDecisions, { params: { days } })
      .then((res) => res.data),

  /** Triggers a CSV download of the hiring-decision report in the browser. */
  downloadHiringDecisions: async (days: number) => {
    const res = await axiosClient.get<Blob>(ENDPOINTS.reports.hiringDecisionsDownload, {
      params: { days },
      responseType: 'blob',
    })
    const disposition = res.headers['content-disposition'] as string | undefined
    const match = disposition?.match(/filename="?([^"]+)"?/)
    const filename = match?.[1] ?? `hiring-decisions-last-${days}-days.csv`
    const url = window.URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  },
}
