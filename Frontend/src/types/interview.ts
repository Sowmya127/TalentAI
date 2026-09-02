export type InterviewType = 'PhoneScreen' | 'Technical' | 'HR' | 'Managerial' | 'Panel'
export type InterviewMode = 'Video' | 'Phone' | 'Onsite'
export type InterviewStatus = 'Scheduled' | 'Rescheduled' | 'Cancelled' | 'Completed'

/** POST /interviews (API spec §8). */
export interface ScheduleInterviewRequest {
  applicationId: number
  interviewType: string
  interviewerId: number
  scheduledAt: string // ISO-8601 with offset
  durationMinutes: number
  mode: string
}

export interface ScheduleInterviewResponse {
  interviewId: number
  status: InterviewStatus
}

export interface Interview {
  interviewId: number
  applicationId: number
  interviewerId: number
  scheduledAt: string
  status: InterviewStatus
  interviewType?: string
  mode?: string
  durationMinutes?: number
  candidateName?: string
  jobTitle?: string
}

export type Recommendation = 'StrongHire' | 'Hire' | 'Hold' | 'Reject'

/** POST /interviews/{interviewId}/feedback. */
export interface InterviewFeedbackRequest {
  technical: number
  communication: number
  problemSolving: number
  domainKnowledge: number
  comments: string
  recommendation: string
}

export interface InterviewFeedbackResponse {
  feedbackId: number
  interviewId: number
  status: string
}

export interface InterviewListParams {
  interviewerId?: number
  status?: InterviewStatus
  page?: number
  size?: number
}

/** GET /interviews/{id}/feedback-summary — aggregated panel scorecards. */
export interface PanelistFeedback {
  interviewerId: number
  interviewerName?: string
  recommendation: string
  technical?: number
  communication?: number
  problemSolving?: number
  domainKnowledge?: number
  comments?: string
}

export interface FeedbackSummary {
  interviewId: number
  panel: PanelistFeedback[]
  consolidatedRecommendation: string
}
