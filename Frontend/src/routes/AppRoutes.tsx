import { Route, Routes } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { RequireAuth } from '@/auth/RequireAuth'
import { RequireRole } from '@/auth/RequireRole'
import { GuestOnly } from '@/auth/GuestOnly'
import { ROLE_GROUPS } from '@/auth/permissions'
import { ROUTES } from '@/constants/routes'

import CandidateDashboardPage from '@/pages/candidate/CandidateDashboardPage'
import CandidateProfilePage from '@/pages/candidate/CandidateProfilePage'
import CandidateProfileEditPage from '@/pages/candidate/CandidateProfileEditPage'
import ResumeUploadPage from '@/pages/candidate/ResumeUploadPage'
import ResumeParseResultPage from '@/pages/candidate/ResumeParseResultPage'
import SkillsPage from '@/pages/candidate/SkillsPage'
import EducationPage from '@/pages/candidate/EducationPage'
import WorkExperiencePage from '@/pages/candidate/WorkExperiencePage'
import CertificationsPage from '@/pages/candidate/CertificationsPage'
import AppliedJobsPage from '@/pages/candidate/AppliedJobsPage'
import JobSearchPage from '@/pages/candidate/JobSearchPage'
import JobDetailsPage from '@/pages/candidate/JobDetailsPage'
import JobApplicationConfirmationPage from '@/pages/candidate/JobApplicationConfirmationPage'

import RecruiterDashboardPage from '@/pages/recruiter/RecruiterDashboardPage'
import CreateJobPage from '@/pages/recruiter/CreateJobPage'
import EditJobPage from '@/pages/recruiter/EditJobPage'
import ViewJobsPage from '@/pages/recruiter/ViewJobsPage'
import ViewApplicantsPage from '@/pages/recruiter/ViewApplicantsPage'
import CandidateDetailsPage from '@/pages/recruiter/CandidateDetailsPage'
import AiMatchResultsPage from '@/pages/recruiter/AiMatchResultsPage'
import ShortlistCandidatesPage from '@/pages/recruiter/ShortlistCandidatesPage'
import ScheduleInterviewPage from '@/pages/recruiter/ScheduleInterviewPage'
import RecruitmentReportsPage from '@/pages/recruiter/RecruitmentReportsPage'

import HiringManagerDashboardPage from '@/pages/hiringManager/HiringManagerDashboardPage'
import JobApprovalsPage from '@/pages/hiringManager/JobApprovalsPage'
import CandidateReviewPage from '@/pages/hiringManager/CandidateReviewPage'
import InterviewFeedbackPage from '@/pages/hiringManager/InterviewFeedbackPage'
import ApproveOfferPage from '@/pages/hiringManager/ApproveOfferPage'
import RejectOfferPage from '@/pages/hiringManager/RejectOfferPage'

import InterviewerDashboardPage from '@/pages/interviewer/InterviewerDashboardPage'
import UpcomingInterviewsPage from '@/pages/interviewer/UpcomingInterviewsPage'
import InterviewerCandidateDetailsPage from '@/pages/interviewer/InterviewerCandidateDetailsPage'
import InterviewFeedbackFormPage from '@/pages/interviewer/InterviewFeedbackFormPage'

import HrAdminDashboardPage from '@/pages/hrAdmin/HrAdminDashboardPage'
import UserManagementPage from '@/pages/hrAdmin/UserManagementPage'
import RoleManagementPage from '@/pages/hrAdmin/RoleManagementPage'
import NotificationManagementPage from '@/pages/hrAdmin/NotificationManagementPage'
import HrReportsPage from '@/pages/hrAdmin/HrReportsPage'
import AuditLogsPage from '@/pages/hrAdmin/AuditLogsPage'

import GenerateOfferPage from '@/pages/offer/GenerateOfferPage'
import OfferApprovalPage from '@/pages/offer/OfferApprovalPage'
import OfferDetailsPage from '@/pages/offer/OfferDetailsPage'

import NotificationCenterPage from '@/pages/notifications/NotificationCenterPage'

import ReportsRecruitmentDashboardPage from '@/pages/reports/RecruitmentDashboardPage'
import HiringMetricsPage from '@/pages/reports/HiringMetricsPage'
import TimeToHirePage from '@/pages/reports/TimeToHirePage'
import RecruitmentFunnelPage from '@/pages/reports/RecruitmentFunnelPage'
import CandidateReportsPage from '@/pages/reports/CandidateReportsPage'

import SettingsProfilePage from '@/pages/settings/SettingsProfilePage'
import ChangePasswordPage from '@/pages/settings/ChangePasswordPage'
import PreferencesPage from '@/pages/settings/PreferencesPage'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import DashboardRedirect from '@/pages/dashboard/DashboardRedirect'
import LandingPage from '@/pages/landing/LandingPage'
import NotFoundPage from '@/pages/errors/NotFoundPage'
import UnauthorizedPage from '@/pages/errors/UnauthorizedPage'
import SessionExpiredPage from '@/pages/errors/SessionExpiredPage'
import ServerErrorPage from '@/pages/errors/ServerErrorPage'

export function AppRoutes() {
  return (
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

        {/* Settings — all authenticated roles */}
        <Route path={ROUTES.settingsProfile} element={<SettingsProfilePage />} />
        <Route path={ROUTES.settingsChangePassword} element={<ChangePasswordPage />} />
        <Route path={ROUTES.settingsPreferences} element={<PreferencesPage />} />
      </Route>

      <Route path={ROUTES.notFound} element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
