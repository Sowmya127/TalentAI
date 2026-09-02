export type ApplicationStatus = 'Applied' | 'Shortlisted' | 'OnHold' | 'Rejected' | 'Selected' | 'Withdrawn'

export interface CandidateApplicationSummary {
  applicationId: number
  jobTitle: string
  status: ApplicationStatus
  appliedOn: string
}

export interface ApplyJobRequest {
  candidateId: number
}

export interface ApplyJobResponse {
  applicationId: number
  status: ApplicationStatus
  message: string
}

/** A row in GET /jobs/{jobId}/applications (recruiter's applicant list). */
export interface ApplicantSummary {
  applicationId: number
  candidateId?: number
  candidateName: string
  matchScore?: number
  status: ApplicationStatus
  appliedOn?: string
}

/** PATCH /applications/{applicationId}/status — the canonical pipeline transition. */
export type PipelineStatus = 'Shortlisted' | 'OnHold' | 'Rejected' | 'Selected'

export interface UpdateApplicationStatusRequest {
  status: PipelineStatus
  reasonCode?: string
  comments?: string
}

export interface UpdateApplicationStatusResponse {
  applicationId: number
  status: ApplicationStatus
}
