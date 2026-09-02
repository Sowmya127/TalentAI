export type JobStatus = 'Draft' | 'PendingApproval' | 'Approved' | 'Published' | 'Closed' | 'Archived'

export interface JobSummary {
  jobId: number
  title: string
  location: string
  department?: string
  employmentType?: string
  status?: JobStatus
}

export interface JobDetail extends JobSummary {
  requiredSkills: string[]
  preferredSkills: string[]
  minExperience?: number
  maxExperience?: number
}

export interface JobSearchParams {
  location?: string
  skills?: string
  experience?: number
  status?: JobStatus
  page?: number
  size?: number
}

export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Internship' | 'Temporary'

/** Matches POST /jobs (API spec §4). */
export interface CreateJobRequest {
  title: string
  department: string
  location: string
  employmentType: string
  requiredSkills: string[]
  preferredSkills: string[]
  minExperience: number
  maxExperience: number
  hiringManagerId: number
  recruiterId: number
}

export interface CreateJobResponse {
  jobId: number
  status: JobStatus
  message: string
}

export interface JobStatusResponse {
  jobId: number
  status: JobStatus
  message?: string
}

export interface ApproveJobRequest {
  decision: 'Approved' | 'Rejected'
  comments?: string
}
