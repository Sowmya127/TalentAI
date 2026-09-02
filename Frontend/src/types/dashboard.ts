/** GET /dashboard (API spec §13). */
export interface DashboardSummary {
  openPositions: number
  applications: number
  shortlisted: number
  interviews: number
  offers: number
  hires: number
}

export interface HiringMetrics {
  timeToHire: number
  timeToFill: number
  offerAcceptanceRate: number
}

export interface RecruitmentFunnel {
  applied: number
  screened: number
  shortlisted: number
  interviewed: number
  offered: number
  hired: number
}

export interface TimeToHire {
  department: string
  avgTimeToHireDays: number
}
