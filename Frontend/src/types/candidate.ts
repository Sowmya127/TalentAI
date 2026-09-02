export interface CandidateProfile {
  candidateId: number
  name: string
  email: string
  location: string | null
  skills: string[]
  experience: number | null
  education: string | null
  resumeUrl: string | null
  phone?: string | null
  noticePeriod?: string | null
  salaryExpectation?: number | null
}

export interface CreateCandidateRequest {
  userId: number
  phone?: string
  location?: string
}

export interface CreateCandidateResponse {
  candidateId: number
  message: string
}

export interface UpdateCandidateProfileRequest {
  location?: string
  noticePeriod?: string
  salaryExpectation?: number
}

export interface UpdateCandidateProfileResponse {
  candidateId: number
  message: string
}

export interface ResumeUploadResponse {
  resumeId: number
  fileName: string
  status: string
}

export interface ResumeParseExtracted {
  skills: string[]
  experience: number
  education: string
  certifications: string[]
  companies: string[]
}

export interface ResumeParseResponse {
  candidateId: number
  extracted: ResumeParseExtracted
  status: string
}

export interface CandidateSkillsResponse {
  candidateId: number
  skills: string[]
}

/** Inferred (not in API spec) — a whole-list replace, the standard shape
 * for a resource with no natural per-item id. Fills the gap left by the
 * spec only documenting GET for skills, even though US-016 expects
 * candidates to be able to update them directly. */
export interface UpdateSkillsRequest {
  skills: string[]
}

export interface Certification {
  certificationId: number
  name: string
  issuer: string
  issueDate: string
}

export interface AddCertificationRequest {
  name: string
  issuer: string
  issueDate: string
}

export interface AddCertificationResponse {
  certificationId: number
  message: string
}

/**
 * Education and Work Experience below are NOT in TalentAI_API_Specification.docx —
 * section 3 (Candidate Management) only documents Skills and Certifications CRUD.
 * The backend DB schema already has dedicated tables for both
 * (V10__create_education.sql, V11__create_work_experience.sql), so these shapes
 * and their endpoints (see api/endpoints.ts) are inferred by mirroring the
 * documented Certifications CRUD pattern one-for-one. Reconcile against the
 * real controllers once they exist.
 */
export interface EducationEntry {
  educationId: number
  degree: string
  institution: string
  fieldOfStudy?: string | null
  startYear?: number | null
  endYear?: number | null
}

export interface EducationRequest {
  degree: string
  institution: string
  fieldOfStudy?: string
  startYear?: number
  endYear?: number
}

export interface WorkExperienceEntry {
  workExperienceId: number
  companyName: string
  jobTitle: string
  startDate: string
  endDate?: string | null
  isCurrent?: boolean
  description?: string | null
}

export interface WorkExperienceRequest {
  companyName: string
  jobTitle: string
  startDate: string
  endDate?: string | null
  isCurrent?: boolean
  description?: string
}
