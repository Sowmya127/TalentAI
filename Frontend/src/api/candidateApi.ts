import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type { ListEnvelope } from '@/types/common'
import type {
  AddCertificationRequest,
  AddCertificationResponse,
  CandidateProfile,
  CandidateSearchParams,
  CandidateSearchResult,
  CandidateSkillsResponse,
  Certification,
  CreateCandidateRequest,
  CreateCandidateResponse,
  EducationEntry,
  EducationRequest,
  ResumeParseResponse,
  ResumeUploadResponse,
  UpdateCandidateProfileRequest,
  UpdateCandidateProfileResponse,
  WorkExperienceEntry,
  WorkExperienceRequest,
} from '@/types/candidate'

export const candidateApi = {
  createProfile: (payload: CreateCandidateRequest) =>
    axiosClient.post<CreateCandidateResponse>(ENDPOINTS.candidates.create, payload).then((res) => res.data),

  /** Recruiter candidate search. */
  search: (params: CandidateSearchParams) =>
    axiosClient
      .get<ListEnvelope<CandidateSearchResult>>(ENDPOINTS.candidates.search, { params })
      .then((res) => res.data),

  /** Recruiter/admin soft-delete of a candidate. */
  remove: (candidateId: number) => axiosClient.delete(ENDPOINTS.candidates.byId(candidateId)),

  getMyProfile: () => axiosClient.get<CandidateProfile>(ENDPOINTS.candidates.me).then((res) => res.data),

  getProfile: (candidateId: number) =>
    axiosClient.get<CandidateProfile>(ENDPOINTS.candidates.byId(candidateId)).then((res) => res.data),

  updateProfile: (candidateId: number, payload: UpdateCandidateProfileRequest) =>
    axiosClient
      .put<UpdateCandidateProfileResponse>(ENDPOINTS.candidates.byId(candidateId), payload)
      .then((res) => res.data),

  uploadResume: (candidateId: number, file: File) => {
    const form = new FormData()
    form.append('resume', file)
    return axiosClient
      .post<ResumeUploadResponse>(ENDPOINTS.candidates.resume(candidateId), form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data)
  },

  parseResume: (candidateId: number) =>
    axiosClient.post<ResumeParseResponse>(ENDPOINTS.candidates.resumeParse(candidateId)).then((res) => res.data),

  getSkills: (candidateId: number) =>
    axiosClient.get<CandidateSkillsResponse>(ENDPOINTS.candidates.skills(candidateId)).then((res) => res.data),

  updateSkills: (candidateId: number, skills: string[]) =>
    axiosClient
      .put<CandidateSkillsResponse>(ENDPOINTS.candidates.skills(candidateId), { skills })
      .then((res) => res.data),

  getCertifications: (candidateId: number) =>
    axiosClient.get<Certification[]>(ENDPOINTS.candidates.certifications(candidateId)).then((res) => res.data),

  addCertification: (candidateId: number, payload: AddCertificationRequest) =>
    axiosClient
      .post<AddCertificationResponse>(ENDPOINTS.candidates.certifications(candidateId), payload)
      .then((res) => res.data),

  removeCertification: (candidateId: number, certificationId: number) =>
    axiosClient.delete(ENDPOINTS.candidates.certificationById(candidateId, certificationId)),

  getEducation: (candidateId: number) =>
    axiosClient.get<EducationEntry[]>(ENDPOINTS.candidates.education(candidateId)).then((res) => res.data),

  addEducation: (candidateId: number, payload: EducationRequest) =>
    axiosClient.post<EducationEntry>(ENDPOINTS.candidates.education(candidateId), payload).then((res) => res.data),

  updateEducation: (candidateId: number, educationId: number, payload: EducationRequest) =>
    axiosClient
      .put<EducationEntry>(ENDPOINTS.candidates.educationById(candidateId, educationId), payload)
      .then((res) => res.data),

  removeEducation: (candidateId: number, educationId: number) =>
    axiosClient.delete(ENDPOINTS.candidates.educationById(candidateId, educationId)),

  getWorkExperience: (candidateId: number) =>
    axiosClient
      .get<WorkExperienceEntry[]>(ENDPOINTS.candidates.workExperience(candidateId))
      .then((res) => res.data),

  addWorkExperience: (candidateId: number, payload: WorkExperienceRequest) =>
    axiosClient
      .post<WorkExperienceEntry>(ENDPOINTS.candidates.workExperience(candidateId), payload)
      .then((res) => res.data),

  updateWorkExperience: (candidateId: number, workExperienceId: number, payload: WorkExperienceRequest) =>
    axiosClient
      .put<WorkExperienceEntry>(
        ENDPOINTS.candidates.workExperienceById(candidateId, workExperienceId),
        payload,
      )
      .then((res) => res.data),

  removeWorkExperience: (candidateId: number, workExperienceId: number) =>
    axiosClient.delete(ENDPOINTS.candidates.workExperienceById(candidateId, workExperienceId)),
}
