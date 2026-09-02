import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type { AiMatchResult, RankedCandidate, SkillGap } from '@/types/aiMatch'
import type { ListEnvelope } from '@/types/common'

export const aiMatchApi = {
  match: (payload: { candidateId: number; jobId: number }) =>
    axiosClient.post<AiMatchResult>(ENDPOINTS.aiMatching.candidateMatch, payload).then((res) => res.data),

  ranking: (jobId: number, params: { sortBy?: string; page?: number; size?: number }) =>
    axiosClient
      .get<ListEnvelope<RankedCandidate>>(ENDPOINTS.jobs.ranking(jobId), { params })
      .then((res) => res.data),

  skillGap: (jobId: number, candidateId: number) =>
    axiosClient.get<SkillGap>(ENDPOINTS.jobs.skillGap(jobId, candidateId)).then((res) => res.data),
}
