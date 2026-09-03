import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type {
  ApproveJobRequest,
  CreateJobRequest,
  CreateJobResponse,
  JobDetail,
  JobSearchParams,
  JobStatusResponse,
} from '@/types/job'
import type { ListEnvelope } from '@/types/common'

export const jobApi = {
  search: (params: JobSearchParams) =>
    axiosClient.get<ListEnvelope<JobDetail>>(ENDPOINTS.jobs.search, { params }).then((res) => res.data),

  /** Public, unauthenticated list of Published jobs (landing page "Live Now"). */
  publicPublished: (params: { page?: number; size?: number } = {}) =>
    axiosClient.get<ListEnvelope<JobDetail>>(ENDPOINTS.jobs.publicPublished, { params }).then((res) => res.data),

  getJob: (jobId: number) => axiosClient.get<JobDetail>(ENDPOINTS.jobs.byId(jobId)).then((res) => res.data),

  createJob: (payload: CreateJobRequest) =>
    axiosClient.post<CreateJobResponse>(ENDPOINTS.jobs.create, payload).then((res) => res.data),

  updateJob: (jobId: number, payload: CreateJobRequest) =>
    axiosClient.put<JobStatusResponse>(ENDPOINTS.jobs.byId(jobId), payload).then((res) => res.data),

  submit: (jobId: number) =>
    axiosClient.patch<JobStatusResponse>(ENDPOINTS.jobs.submit(jobId)).then((res) => res.data),

  approve: (jobId: number, payload: ApproveJobRequest) =>
    axiosClient.patch<JobStatusResponse>(ENDPOINTS.jobs.approve(jobId), payload).then((res) => res.data),

  publish: (jobId: number) =>
    axiosClient.patch<JobStatusResponse>(ENDPOINTS.jobs.publish(jobId)).then((res) => res.data),

  close: (jobId: number) =>
    axiosClient.patch<JobStatusResponse>(ENDPOINTS.jobs.close(jobId)).then((res) => res.data),

  archive: (jobId: number) =>
    axiosClient.patch<JobStatusResponse>(ENDPOINTS.jobs.archive(jobId)).then((res) => res.data),
}
