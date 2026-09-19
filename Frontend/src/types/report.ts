export type ReportFormat = 'json' | 'csv' | 'xlsx'

export interface GeneratedReport {
  reportId: string
  downloadUrl: string
}

/** A single Selected/Rejected decision in the hiring-manager history report. */
export interface HiringDecisionRow {
  applicationId: number
  decisionDate: string | null
  candidateName: string | null
  email: string | null
  jobTitle: string | null
  decision: string
}

/** Summary + detail rows for "selected vs rejected in the last N days". */
export interface HiringDecisionSummary {
  days: number
  from: string
  to: string
  selected: number
  rejected: number
  total: number
  rows: HiringDecisionRow[]
}
