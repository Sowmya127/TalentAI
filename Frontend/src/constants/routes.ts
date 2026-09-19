/** Central path registry. Import these instead of hand-typing paths. */
export const ROUTES = {
  // Auth
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  // Root / dashboard
  home: '/',
  dashboard: '/dashboard',

  // Candidate module
  candidateDashboard: '/candidate',
  candidateProfile: '/candidate/profile',
  candidateProfileEdit: '/candidate/profile/edit',
  candidateResume: '/candidate/resume',
  candidateResumeParseResult: '/candidate/resume/parse-result',
  candidateSkills: '/candidate/skills',
  candidateEducation: '/candidate/education',
  candidateExperience: '/candidate/experience',
  candidateCertifications: '/candidate/certifications',
  candidateApplications: '/candidate/applications',
  candidateJobSearch: '/candidate/jobs',
  candidateJobDetails: '/candidate/jobs/:jobId',
  candidateApplicationConfirmation: '/candidate/jobs/:jobId/applied',

  // Recruiter module
  recruiterDashboard: '/recruiter',
  recruiterJobCreate: '/recruiter/jobs/new',
  recruiterJobEdit: '/recruiter/jobs/:jobId/edit',
  recruiterJobs: '/recruiter/jobs',
  recruiterJobApplicants: '/recruiter/jobs/:jobId/applicants',
  recruiterCandidateSearch: '/recruiter/candidates',
  recruiterCandidateDetails: '/recruiter/candidates/:candidateId',
  recruiterAiMatchResults: '/recruiter/jobs/:jobId/ai-match',
  recruiterShortlist: '/recruiter/jobs/:jobId/shortlist',
  recruiterScheduleInterview: '/recruiter/applications/:applicationId/schedule-interview',
  recruiterReports: '/recruiter/reports',

  // Hiring manager module
  hiringManagerDashboard: '/hiring-manager',
  hiringManagerJobApprovals: '/hiring-manager/job-approvals',
  hiringManagerCandidateReview: '/hiring-manager/applications/:applicationId/review',
  hiringManagerInterviewFeedback: '/hiring-manager/interviews/:interviewId/feedback',
  hiringManagerApproveOffer: '/hiring-manager/offers/:offerId/approve',
  hiringManagerRejectOffer: '/hiring-manager/offers/:offerId/reject',

  // Interviewer module
  interviewerDashboard: '/interviewer',
  interviewerUpcoming: '/interviewer/upcoming',
  interviewerCandidateDetails: '/interviewer/candidates/:candidateId',
  interviewerFeedbackForm: '/interviewer/interviews/:interviewId/feedback',

  // HR Admin module
  hrAdminDashboard: '/hr-admin',
  hrAdminUsers: '/hr-admin/users',
  hrAdminRegistrations: '/hr-admin/registrations',
  hrAdminRoles: '/hr-admin/roles',
  hrAdminNotifications: '/hr-admin/notifications',
  hrAdminReports: '/hr-admin/reports',
  hrAdminAuditLogs: '/hr-admin/audit-logs',

  // Offers
  offerGenerate: '/offers/new',
  offerApproval: '/offers/:offerId/approval',
  offerDetails: '/offers/:offerId',

  // Notifications
  notifications: '/notifications',

  // Reports
  reportsDashboard: '/reports',
  reportsHiringMetrics: '/reports/hiring-metrics',
  reportsTimeToHire: '/reports/time-to-hire',
  reportsFunnel: '/reports/funnel',
  reportsCandidates: '/reports/candidates',
  reportsHiringDecisions: '/reports/hiring-decisions',

  // Settings
  settingsProfile: '/settings/profile',
  settingsChangePassword: '/settings/change-password',
  settingsPreferences: '/settings/preferences',

  // System / error pages
  notFound: '/404',
  unauthorized: '/403',
  sessionExpired: '/session-expired',
  serverError: '/500',
} as const

export function buildPath(pattern: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce<string>(
    (path, [key, value]) => path.replace(`:${key}`, String(value)),
    pattern,
  )
}
