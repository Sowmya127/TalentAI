import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type {
  FeedbackSummary,
  Interview,
  InterviewFeedbackRequest,
  InterviewFeedbackResponse,
  InterviewListParams,
  ScheduleInterviewRequest,
  ScheduleInterviewResponse,
} from '@/types/interview'
import type { ListEnvelope } from '@/types/common'

export const interviewApi = {
  schedule: (payload: ScheduleInterviewRequest) =>
    axiosClient.post<ScheduleInterviewResponse>(ENDPOINTS.interviews.create, payload).then((res) => res.data),

  list: (params: InterviewListParams) =>
    axiosClient.get<ListEnvelope<Interview>>(ENDPOINTS.interviews.list, { params }).then((res) => res.data),

  getInterview: (interviewId: number) =>
    axiosClient.get<Interview>(ENDPOINTS.interviews.byId(interviewId)).then((res) => res.data),

  reschedule: (interviewId: number, payload: { newScheduledAt: string; reason: string }) =>
    axiosClient
      .patch<{ interviewId: number; status: string }>(ENDPOINTS.interviews.reschedule(interviewId), payload)
      .then((res) => res.data),

  cancel: (interviewId: number, payload: { reason: string }) =>
    axiosClient
      .patch<{ interviewId: number; status: string }>(ENDPOINTS.interviews.cancel(interviewId), payload)
      .then((res) => res.data),

  submitFeedback: (interviewId: number, payload: InterviewFeedbackRequest) =>
    axiosClient
      .post<InterviewFeedbackResponse>(ENDPOINTS.interviews.feedback(interviewId), payload)
      .then((res) => res.data),

  feedbackSummary: (interviewId: number) =>
    axiosClient
      .get<FeedbackSummary>(ENDPOINTS.interviews.feedbackSummary(interviewId))
      .then((res) => res.data),
}
