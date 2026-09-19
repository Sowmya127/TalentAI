/**
 * Central REST path registry, mirroring TalentAI_API_Specification.docx.
 * Base URL (axiosClient) already carries /api/v1, so paths here start
 * after that. Only Auth and User & Access Management (sections 1–2) are
 * confirmed against the live Spring Boot implementation; everything
 * else reflects the documented contract and will be wired up module by
 * module as those screens are built.
 */
export const ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  registration: {
    // Public: roles offered on the "Register as" form (self-registerable only).
    selfRegisterableRoles: '/public/roles',
    // Admin approval module.
    requests: '/admin/registration-requests',
    request: (id: number | string) => `/admin/registration-requests/${id}`,
    history: (id: number | string) => `/admin/registration-requests/${id}/history`,
    approve: (id: number | string) => `/admin/registration-requests/${id}/approve`,
    reject: (id: number | string) => `/admin/registration-requests/${id}/reject`,
  },
  users: {
    create: '/users',
    // Inferred — not in the API spec, which only has token-based
    // /auth/reset-password, no authenticated self-service change-password.
    // Conventional self-scoped path; wire the real one when the backend adds it.
    changePassword: (userId: number | string) => `/users/${userId}/change-password`,
    byId: (userId: number | string) => `/users/${userId}`,
    status: (userId: number | string) => `/users/${userId}/status`,
    search: '/users',
  },
  candidates: {
    create: '/candidates',
    // Recruiter candidate search (paginated ListResponse envelope).
    search: '/candidates/search',
    // Inferred — not in the API spec. The spec has no way to resolve "my
    // candidate record" from the JWT alone (every /candidates/{id} endpoint
    // assumes the id is already known), so this fills that one real gap
    // using the standard self-scoped REST convention.
    me: '/candidates/me',
    byId: (candidateId: number | string) => `/candidates/${candidateId}`,
    resume: (candidateId: number | string) => `/candidates/${candidateId}/resume`,
    resumeParse: (candidateId: number | string) => `/candidates/${candidateId}/resume/parse`,
    skills: (candidateId: number | string) => `/candidates/${candidateId}/skills`,
    certifications: (candidateId: number | string) => `/candidates/${candidateId}/certifications`,
    certificationById: (candidateId: number | string, certificationId: number | string) =>
      `/candidates/${candidateId}/certifications/${certificationId}`,
    // Inferred — mirrors the documented Certifications CRUD (see types/candidate.ts).
    education: (candidateId: number | string) => `/candidates/${candidateId}/education`,
    educationById: (candidateId: number | string, educationId: number | string) =>
      `/candidates/${candidateId}/education/${educationId}`,
    workExperience: (candidateId: number | string) => `/candidates/${candidateId}/work-experience`,
    workExperienceById: (candidateId: number | string, workExperienceId: number | string) =>
      `/candidates/${candidateId}/work-experience/${workExperienceId}`,
    applications: (candidateId: number | string) => `/candidates/${candidateId}/applications`,
  },
  jobs: {
    create: '/jobs',
    search: '/jobs',
    // Public, unauthenticated list of Published jobs for the landing page.
    publicPublished: '/public/jobs',
    byId: (jobId: number | string) => `/jobs/${jobId}`,
    submit: (jobId: number | string) => `/jobs/${jobId}/submit`,
    approve: (jobId: number | string) => `/jobs/${jobId}/approve`,
    publish: (jobId: number | string) => `/jobs/${jobId}/publish`,
    close: (jobId: number | string) => `/jobs/${jobId}/close`,
    archive: (jobId: number | string) => `/jobs/${jobId}/archive`,
    apply: (jobId: number | string) => `/jobs/${jobId}/apply`,
    applications: (jobId: number | string) => `/jobs/${jobId}/applications`,
    ranking: (jobId: number | string) => `/jobs/${jobId}/ranking`,
    skillGap: (jobId: number | string, candidateId: number | string) =>
      `/jobs/${jobId}/skill-gap/${candidateId}`,
    screeningQuestions: (jobId: number | string) => `/jobs/${jobId}/screening-questions`,
  },
  applications: {
    withdraw: (applicationId: number | string) => `/applications/${applicationId}/withdraw`,
    status: (applicationId: number | string) => `/applications/${applicationId}/status`,
    screeningResponses: (applicationId: number | string) =>
      `/applications/${applicationId}/screening-responses`,
    screeningResults: (applicationId: number | string) =>
      `/applications/${applicationId}/screening-results`,
  },
  aiMatching: {
    candidateMatch: '/ai/candidate-match',
  },
  interviews: {
    create: '/interviews',
    // Inferred — not in the API spec. The spec documents GET /interviews/{id}
    // but no way to list an interviewer's assigned interviews; this fills that
    // gap with the conventional collection + query-param filter shape.
    list: '/interviews',
    byId: (interviewId: number | string) => `/interviews/${interviewId}`,
    interviewer: (interviewId: number | string) => `/interviews/${interviewId}/interviewer`,
    reschedule: (interviewId: number | string) => `/interviews/${interviewId}/reschedule`,
    cancel: (interviewId: number | string) => `/interviews/${interviewId}/cancel`,
    feedback: (interviewId: number | string) => `/interviews/${interviewId}/feedback`,
    feedbackSummary: (interviewId: number | string) => `/interviews/${interviewId}/feedback-summary`,
  },
  offers: {
    create: '/offers',
    byId: (offerId: number | string) => `/offers/${offerId}`,
    approve: (offerId: number | string) => `/offers/${offerId}/approve`,
    send: (offerId: number | string) => `/offers/${offerId}/send`,
    accept: (offerId: number | string) => `/offers/${offerId}/accept`,
    decline: (offerId: number | string) => `/offers/${offerId}/decline`,
    backgroundCheck: (offerId: number | string) => `/offers/${offerId}/background-check`,
  },
  backgroundChecks: {
    byId: (checkId: number | string) => `/background-checks/${checkId}`,
  },
  onboarding: {
    tasks: (applicationId: number | string) => `/onboarding/${applicationId}/tasks`,
    updateTask: (taskId: number | string) => `/onboarding/tasks/${taskId}`,
  },
  notifications: {
    trigger: '/notifications',
    history: '/notifications',
  },
  dashboard: {
    summary: '/dashboard',
    metrics: '/dashboard/metrics',
    funnel: '/dashboard/funnel',
    timeToHire: '/dashboard/time-to-hire',
  },
  reports: {
    candidates: '/reports/candidates',
    jobs: '/reports/jobs',
    recruiters: '/reports/recruiters',
    interviews: '/reports/interviews',
    offers: '/reports/offers',
    // Hiring-manager decision history (selected vs rejected in the last N days).
    hiringDecisions: '/reports/hiring-decisions',
    hiringDecisionsDownload: '/reports/hiring-decisions/download',
  },
  admin: {
    roles: '/admin/roles',
    assignRole: (userId: number | string) => `/admin/users/${userId}/roles`,
    workflow: '/admin/workflow',
    audit: '/admin/audit',
  },
} as const
