import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type {
  ApplicantSummary,
  ApplyJobRequest,
  ApplyJobResponse,
  CandidateApplicationSummary,
  UpdateApplicationStatusRequest,
  UpdateApplicationStatusResponse,
} from '@/types/application'
import type { ListEnvelope } from '@/types/common'

export const applicationApi = {
  apply: (jobId: number, payload: ApplyJobRequest) =>
    axiosClient.post<ApplyJobResponse>(ENDPOINTS.jobs.apply(jobId), payload).then((res) => res.data),

  withdraw: (applicationId: number) =>
    axiosClient
      .patch<{ applicationId: number; status: string }>(ENDPOINTS.applications.withdraw(applicationId))
      .then((res) => res.data),

  getMyApplications: (candidateId: number) =>
    axiosClient
      .get<ListEnvelope<CandidateApplicationSummary>>(ENDPOINTS.candidates.applications(candidateId))
      .then((res) => res.data),

  getApplicants: (jobId: number, params: { status?: string; page?: number; size?: number }) =>
    axiosClient
      .get<ListEnvelope<ApplicantSummary>>(ENDPOINTS.jobs.applications(jobId), { params })
      .then((res) => res.data),

  updateStatus: (applicationId: number, payload: UpdateApplicationStatusRequest) =>
    axiosClient
      .patch<UpdateApplicationStatusResponse>(ENDPOINTS.applications.status(applicationId), payload)
      .then((res) => res.data),
}
