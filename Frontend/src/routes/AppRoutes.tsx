import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { RequireAuth } from '@/auth/RequireAuth'
import { RequireRole } from '@/auth/RequireRole'
import { GuestOnly } from '@/auth/GuestOnly'
import { ROLE_GROUPS } from '@/auth/permissions'
import { ROUTES } from '@/constants/routes'

// Error/fallback pages stay eager: they must render synchronously (ErrorBoundary
// depends on ServerErrorPage) and can't rely on a chunk fetch during an error.
import NotFoundPage from '@/pages/errors/NotFoundPage'
import UnauthorizedPage from '@/pages/errors/UnauthorizedPage'
import SessionExpiredPage from '@/pages/errors/SessionExpiredPage'
import ServerErrorPage from '@/pages/errors/ServerErrorPage'

// Route-level code splitting: each page is its own chunk, fetched on demand, so a
// user only downloads the pages their role actually visits (smaller first load).
const CandidateDashboardPage = lazy(() => import('@/pages/candidate/CandidateDashboardPage'))
const CandidateProfilePage = lazy(() => import('@/pages/candidate/CandidateProfilePage'))
const CandidateProfileEditPage = lazy(() => import('@/pages/candidate/CandidateProfileEditPage'))
const ResumeUploadPage = lazy(() => import('@/pages/candidate/ResumeUploadPage'))
const ResumeParseResultPage = lazy(() => import('@/pages/candidate/ResumeParseResultPage'))
const SkillsPage = lazy(() => import('@/pages/candidate/SkillsPage'))
const EducationPage = lazy(() => import('@/pages/candidate/EducationPage'))
const WorkExperiencePage = lazy(() => import('@/pages/candidate/WorkExperiencePage'))
const CertificationsPage = lazy(() => import('@/pages/candidate/CertificationsPage'))
const AppliedJobsPage = lazy(() => import('@/pages/candidate/AppliedJobsPage'))
const JobSearchPage = lazy(() => import('@/pages/candidate/JobSearchPage'))
const JobDetailsPage = lazy(() => import('@/pages/candidate/JobDetailsPage'))
const JobApplicationConfirmationPage = lazy(() => import('@/pages/candidate/JobApplicationConfirmationPage'))

const RecruiterDashboardPage = lazy(() => import('@/pages/recruiter/RecruiterDashboardPage'))
const CreateJobPage = lazy(() => import('@/pages/recruiter/CreateJobPage'))
const EditJobPage = lazy(() => import('@/pages/recruiter/EditJobPage'))
const ViewJobsPage = lazy(() => import('@/pages/recruiter/ViewJobsPage'))
const ViewApplicantsPage = lazy(() => import('@/pages/recruiter/ViewApplicantsPage'))
const CandidateSearchPage = lazy(() => import('@/pages/recruiter/CandidateSearchPage'))
const CandidateDetailsPage = lazy(() => import('@/pages/recruiter/CandidateDetailsPage'))
const AiMatchResultsPage = lazy(() => import('@/pages/recruiter/AiMatchResultsPage'))
const ShortlistCandidatesPage = lazy(() => import('@/pages/recruiter/ShortlistCandidatesPage'))
const ScheduleInterviewPage = lazy(() => import('@/pages/recruiter/ScheduleInterviewPage'))
const RecruitmentReportsPage = lazy(() => import('@/pages/recruiter/RecruitmentReportsPage'))

const HiringManagerDashboardPage = lazy(() => import('@/pages/hiringManager/HiringManagerDashboardPage'))
const JobApprovalsPage = lazy(() => import('@/pages/hiringManager/JobApprovalsPage'))
const CandidateReviewPage = lazy(() => import('@/pages/hiringManager/CandidateReviewPage'))
const InterviewFeedbackPage = lazy(() => import('@/pages/hiringManager/InterviewFeedbackPage'))
const ApproveOfferPage = lazy(() => import('@/pages/hiringManager/ApproveOfferPage'))
const RejectOfferPage = lazy(() => import('@/pages/hiringManager/RejectOfferPage'))

const InterviewerDashboardPage = lazy(() => import('@/pages/interviewer/InterviewerDashboardPage'))
const UpcomingInterviewsPage = lazy(() => import('@/pages/interviewer/UpcomingInterviewsPage'))
const InterviewerCandidateDetailsPage = lazy(() => import('@/pages/interviewer/InterviewerCandidateDetailsPage'))
const InterviewFeedbackFormPage = lazy(() => import('@/pages/interviewer/InterviewFeedbackFormPage'))

const HrAdminDashboardPage = lazy(() => import('@/pages/hrAdmin/HrAdminDashboardPage'))
const UserManagementPage = lazy(() => import('@/pages/hrAdmin/UserManagementPage'))
const RegistrationApprovalsPage = lazy(() => import('@/pages/hrAdmin/RegistrationApprovalsPage'))
const RoleManagementPage = lazy(() => import('@/pages/hrAdmin/RoleManagementPage'))
const NotificationManagementPage = lazy(() => import('@/pages/hrAdmin/NotificationManagementPage'))
const HrReportsPage = lazy(() => import('@/pages/hrAdmin/HrReportsPage'))
const AuditLogsPage = lazy(() => import('@/pages/hrAdmin/AuditLogsPage'))

const GenerateOfferPage = lazy(() => import('@/pages/offer/GenerateOfferPage'))
const OfferApprovalPage = lazy(() => import('@/pages/offer/OfferApprovalPage'))
const OfferDetailsPage = lazy(() => import('@/pages/offer/OfferDetailsPage'))

const NotificationCenterPage = lazy(() => import('@/pages/notifications/NotificationCenterPage'))

const ReportsRecruitmentDashboardPage = lazy(() => import('@/pages/reports/RecruitmentDashboardPage'))
const HiringMetricsPage = lazy(() => import('@/pages/reports/HiringMetricsPage'))
const TimeToHirePage = lazy(() => import('@/pages/reports/TimeToHirePage'))
const RecruitmentFunnelPage = lazy(() => import('@/pages/reports/RecruitmentFunnelPage'))
const CandidateReportsPage = lazy(() => import('@/pages/reports/CandidateReportsPage'))
const HiringDecisionsReportPage = lazy(() => import('@/pages/reports/HiringDecisionsReportPage'))

const SettingsProfilePage = lazy(() => import('@/pages/settings/SettingsProfilePage'))
const ChangePasswordPage = lazy(() => import('@/pages/settings/ChangePasswordPage'))
const PreferencesPage = lazy(() => import('@/pages/settings/PreferencesPage'))

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const DashboardRedirect = lazy(() => import('@/pages/dashboard/DashboardRedirect'))
const LandingPage = lazy(() => import('@/pages/landing/LandingPage'))

function RouteFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Public landing page — shown before login */}
      <Route path={ROUTES.home} element={<LandingPage />} />

      {/* Auth */}
      <Route
        element={
          <GuestOnly>
            <AuthLayout />
          </GuestOnly>
        }
      >
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
      </Route>

      {/* System / error pages — standalone, no shell */}
      <Route path={ROUTES.unauthorized} element={<UnauthorizedPage />} />
      <Route path={ROUTES.sessionExpired} element={<SessionExpiredPage />} />
      <Route path={ROUTES.serverError} element={<ServerErrorPage />} />

      {/* Authenticated app shell */}
      <Route
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route path={ROUTES.dashboard} element={<DashboardRedirect />} />

        {/* Candidate module */}
        <Route
          path={ROUTES.candidateDashboard}
          element={
            <RequireRole roles={ROLE_GROUPS.candidate}>
              <CandidateDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.candidateProfile}
          element={
            <RequireRole roles={ROLE_GROUPS.candidate}>
              <CandidateProfilePage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.candidateProfileEdit}
          element={
            <RequireRole roles={ROLE_GROUPS.candidate}>
              <CandidateProfileEditPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.candidateResume}
          element={
            <RequireRole roles={ROLE_GROUPS.candidate}>
              <ResumeUploadPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.candidateResumeParseResult}
          element={
            <RequireRole roles={ROLE_GROUPS.candidate}>
              <ResumeParseResultPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.candidateSkills}
          element={
            <RequireRole roles={ROLE_GROUPS.candidate}>
              <SkillsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.candidateEducation}
          element={
            <RequireRole roles={ROLE_GROUPS.candidate}>
              <EducationPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.candidateExperience}
          element={
            <RequireRole roles={ROLE_GROUPS.candidate}>
              <WorkExperiencePage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.candidateCertifications}
          element={
            <RequireRole roles={ROLE_GROUPS.candidate}>
              <CertificationsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.candidateApplications}
          element={
            <RequireRole roles={ROLE_GROUPS.candidate}>
              <AppliedJobsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.candidateJobSearch}
          element={
            <RequireRole roles={ROLE_GROUPS.candidate}>
              <JobSearchPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.candidateJobDetails}
          element={
            <RequireRole roles={ROLE_GROUPS.candidate}>
              <JobDetailsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.candidateApplicationConfirmation}
          element={
            <RequireRole roles={ROLE_GROUPS.candidate}>
              <JobApplicationConfirmationPage />
            </RequireRole>
          }
        />

        {/* Recruiter module */}
        <Route
          path={ROUTES.recruiterDashboard}
          element={
            <RequireRole roles={ROLE_GROUPS.recruiter}>
              <RecruiterDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.recruiterJobCreate}
          element={
            <RequireRole roles={ROLE_GROUPS.recruiter}>
              <CreateJobPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.recruiterJobEdit}
          element={
            <RequireRole roles={ROLE_GROUPS.recruiter}>
              <EditJobPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.recruiterJobs}
          element={
            <RequireRole roles={ROLE_GROUPS.recruiter}>
              <ViewJobsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.recruiterJobApplicants}
          element={
            <RequireRole roles={ROLE_GROUPS.recruiter}>
              <ViewApplicantsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.recruiterCandidateSearch}
          element={
            <RequireRole roles={ROLE_GROUPS.recruiter}>
              <CandidateSearchPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.recruiterCandidateDetails}
          element={
            <RequireRole roles={ROLE_GROUPS.recruiter}>
              <CandidateDetailsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.recruiterAiMatchResults}
          element={
            <RequireRole roles={ROLE_GROUPS.recruiter}>
              <AiMatchResultsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.recruiterShortlist}
          element={
            <RequireRole roles={ROLE_GROUPS.recruiter}>
              <ShortlistCandidatesPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.recruiterScheduleInterview}
          element={
            <RequireRole roles={ROLE_GROUPS.recruiter}>
              <ScheduleInterviewPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.recruiterReports}
          element={
            <RequireRole roles={ROLE_GROUPS.recruiter}>
              <RecruitmentReportsPage />
            </RequireRole>
          }
        />

        {/* Hiring Manager module */}
        <Route
          path={ROUTES.hiringManagerDashboard}
          element={
            <RequireRole roles={ROLE_GROUPS.hiringManager}>
              <HiringManagerDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.hiringManagerJobApprovals}
          element={
            <RequireRole roles={[...ROLE_GROUPS.hiringManager, ...ROLE_GROUPS.hrAdmin]}>
              <JobApprovalsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.hiringManagerCandidateReview}
          element={
            <RequireRole roles={ROLE_GROUPS.hiringManager}>
              <CandidateReviewPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.hiringManagerInterviewFeedback}
          element={
            <RequireRole roles={ROLE_GROUPS.hiringManager}>
              <InterviewFeedbackPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.hiringManagerApproveOffer}
          element={
            <RequireRole roles={ROLE_GROUPS.hiringManager}>
              <ApproveOfferPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.hiringManagerRejectOffer}
          element={
            <RequireRole roles={ROLE_GROUPS.hiringManager}>
              <RejectOfferPage />
            </RequireRole>
          }
        />

        {/* Interviewer module */}
        <Route
          path={ROUTES.interviewerDashboard}
          element={
            <RequireRole roles={ROLE_GROUPS.interviewer}>
              <InterviewerDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.interviewerUpcoming}
          element={
            <RequireRole roles={ROLE_GROUPS.interviewer}>
              <UpcomingInterviewsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.interviewerCandidateDetails}
          element={
            <RequireRole roles={ROLE_GROUPS.interviewer}>
              <InterviewerCandidateDetailsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.interviewerFeedbackForm}
          element={
            <RequireRole roles={ROLE_GROUPS.interviewer}>
              <InterviewFeedbackFormPage />
            </RequireRole>
          }
        />

        {/* HR Admin module */}
        <Route
          path={ROUTES.hrAdminDashboard}
          element={
            <RequireRole roles={ROLE_GROUPS.hrAdmin}>
              <HrAdminDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.hrAdminUsers}
          element={
            <RequireRole roles={ROLE_GROUPS.hrAdmin}>
              <UserManagementPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.hrAdminRegistrations}
          element={
            <RequireRole roles={ROLE_GROUPS.hrAdmin}>
              <RegistrationApprovalsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.hrAdminRoles}
          element={
            <RequireRole roles={ROLE_GROUPS.hrAdmin}>
              <RoleManagementPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.hrAdminNotifications}
          element={
            <RequireRole roles={ROLE_GROUPS.hrAdmin}>
              <NotificationManagementPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.hrAdminReports}
          element={
            <RequireRole roles={ROLE_GROUPS.hrAdmin}>
              <HrReportsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.hrAdminAuditLogs}
          element={
            <RequireRole roles={ROLE_GROUPS.hrAdmin}>
              <AuditLogsPage />
            </RequireRole>
          }
        />

        {/* Offer management — reachable from Candidate, Recruiter, and Hiring Manager flows */}
        <Route
          path={ROUTES.offerGenerate}
          element={
            <RequireRole roles={ROLE_GROUPS.anyInternal}>
              <GenerateOfferPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.offerApproval}
          element={
            <RequireRole roles={ROLE_GROUPS.anyInternal}>
              <OfferApprovalPage />
            </RequireRole>
          }
        />
        <Route path={ROUTES.offerDetails} element={<OfferDetailsPage />} />

        {/* Notifications — all authenticated roles */}
        <Route path={ROUTES.notifications} element={<NotificationCenterPage />} />

        {/* Reports — recruiter / hiring manager / HR admin */}
        <Route
          path={ROUTES.reportsDashboard}
          element={
            <RequireRole roles={[...ROLE_GROUPS.recruiter, ...ROLE_GROUPS.hiringManager, ...ROLE_GROUPS.hrAdmin]}>
              <ReportsRecruitmentDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.reportsHiringMetrics}
          element={
            <RequireRole roles={[...ROLE_GROUPS.recruiter, ...ROLE_GROUPS.hiringManager, ...ROLE_GROUPS.hrAdmin]}>
              <HiringMetricsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.reportsTimeToHire}
          element={
            <RequireRole roles={[...ROLE_GROUPS.recruiter, ...ROLE_GROUPS.hiringManager, ...ROLE_GROUPS.hrAdmin]}>
              <TimeToHirePage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.reportsFunnel}
          element={
            <RequireRole roles={[...ROLE_GROUPS.recruiter, ...ROLE_GROUPS.hiringManager, ...ROLE_GROUPS.hrAdmin]}>
              <RecruitmentFunnelPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.reportsCandidates}
          element={
            <RequireRole roles={[...ROLE_GROUPS.recruiter, ...ROLE_GROUPS.hiringManager, ...ROLE_GROUPS.hrAdmin]}>
              <CandidateReportsPage />
            </RequireRole>
          }
        />
        <Route
          path={ROUTES.reportsHiringDecisions}
          element={
            <RequireRole roles={[...ROLE_GROUPS.hiringManager, ...ROLE_GROUPS.hrAdmin]}>
              <HiringDecisionsReportPage />
            </RequireRole>
          }
        />

        {/* Settings — all authenticated roles */}
        <Route path={ROUTES.settingsProfile} element={<SettingsProfilePage />} />
        <Route path={ROUTES.settingsChangePassword} element={<ChangePasswordPage />} />
        <Route path={ROUTES.settingsPreferences} element={<PreferencesPage />} />
      </Route>

      <Route path={ROUTES.notFound} element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  )
}
