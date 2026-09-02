export type ReportFormat = 'json' | 'csv' | 'xlsx'

export interface GeneratedReport {
  reportId: string
  downloadUrl: string
}
