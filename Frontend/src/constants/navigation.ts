import type { ComponentType } from 'react'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import { RoleKey } from './roles'
import { ROUTES } from './routes'

export interface NavItem {
  label: string
  path: string
  icon: ComponentType<{ fontSize?: 'small' | 'medium' }>
  roles: RoleKey[]
}

/**
 * Sidebar entries only — one per top-level list/dashboard page. Detail
 * pages that require an id (Job Details, Candidate Details, Offer
 * Approval, Interview Feedback Form, …) are reached by clicking through
 * from these list pages, not linked directly from the sidebar.
 */
export const NAV_ITEMS: NavItem[] = [
  // Candidate
  { label: 'Dashboard', path: ROUTES.candidateDashboard, icon: DashboardOutlinedIcon, roles: [RoleKey.CANDIDATE] },
  { label: 'My Profile', path: ROUTES.candidateProfile, icon: PersonOutlineIcon, roles: [RoleKey.CANDIDATE] },
  { label: 'Resume', path: ROUTES.candidateResume, icon: DescriptionOutlinedIcon, roles: [RoleKey.CANDIDATE] },
  { label: 'Skills', path: ROUTES.candidateSkills, icon: BuildOutlinedIcon, roles: [RoleKey.CANDIDATE] },
  { label: 'Education', path: ROUTES.candidateEducation, icon: SchoolOutlinedIcon, roles: [RoleKey.CANDIDATE] },
  { label: 'Work Experience', path: ROUTES.candidateExperience, icon: WorkOutlineIcon, roles: [RoleKey.CANDIDATE] },
  {
    label: 'Certifications',
    path: ROUTES.candidateCertifications,
    icon: WorkspacePremiumOutlinedIcon,
    roles: [RoleKey.CANDIDATE],
  },
  { label: 'Search Jobs', path: ROUTES.candidateJobSearch, icon: SearchOutlinedIcon, roles: [RoleKey.CANDIDATE] },
  {
    label: 'My Applications',
    path: ROUTES.candidateApplications,
    icon: AssignmentOutlinedIcon,
    roles: [RoleKey.CANDIDATE],
  },

  // Recruiter
  { label: 'Dashboard', path: ROUTES.recruiterDashboard, icon: DashboardOutlinedIcon, roles: [RoleKey.RECRUITER] },
  { label: 'Jobs', path: ROUTES.recruiterJobs, icon: WorkOutlineIcon, roles: [RoleKey.RECRUITER] },
  {
    label: 'Recruitment Reports',
    path: ROUTES.recruiterReports,
    icon: BarChartOutlinedIcon,
    roles: [RoleKey.RECRUITER],
  },

  // Hiring Manager
  {
    label: 'Dashboard',
    path: ROUTES.hiringManagerDashboard,
    icon: DashboardOutlinedIcon,
    roles: [RoleKey.HIRING_MANAGER],
  },
  {
    label: 'Requisition Approvals',
    path: ROUTES.hiringManagerJobApprovals,
    icon: FactCheckOutlinedIcon,
    roles: [RoleKey.HIRING_MANAGER],
  },
  { label: 'Reports', path: ROUTES.reportsDashboard, icon: BarChartOutlinedIcon, roles: [RoleKey.HIRING_MANAGER] },

  // Interviewer
  {
    label: 'Dashboard',
    path: ROUTES.interviewerDashboard,
    icon: DashboardOutlinedIcon,
    roles: [RoleKey.INTERVIEWER],
  },
  {
    label: 'Upcoming Interviews',
    path: ROUTES.interviewerUpcoming,
    icon: EventAvailableOutlinedIcon,
    roles: [RoleKey.INTERVIEWER],
  },

  // HR Admin / System Admin
  {
    label: 'Dashboard',
    path: ROUTES.hrAdminDashboard,
    icon: DashboardOutlinedIcon,
    roles: [RoleKey.HR_ADMIN, RoleKey.SYSTEM_ADMIN],
  },
  {
    label: 'User Management',
    path: ROUTES.hrAdminUsers,
    icon: GroupOutlinedIcon,
    roles: [RoleKey.HR_ADMIN, RoleKey.SYSTEM_ADMIN],
  },
  {
    label: 'Role Management',
    path: ROUTES.hrAdminRoles,
    icon: AdminPanelSettingsOutlinedIcon,
    roles: [RoleKey.HR_ADMIN, RoleKey.SYSTEM_ADMIN],
  },
  {
    label: 'Notification Management',
    path: ROUTES.hrAdminNotifications,
    icon: NotificationsActiveOutlinedIcon,
    roles: [RoleKey.HR_ADMIN, RoleKey.SYSTEM_ADMIN],
  },
  {
    label: 'Reports',
    path: ROUTES.hrAdminReports,
    icon: BarChartOutlinedIcon,
    roles: [RoleKey.HR_ADMIN, RoleKey.SYSTEM_ADMIN],
  },
  {
    label: 'Audit Logs',
    path: ROUTES.hrAdminAuditLogs,
    icon: HistoryOutlinedIcon,
    roles: [RoleKey.HR_ADMIN, RoleKey.SYSTEM_ADMIN],
  },
]

export function getNavForRoles(roleKeys: RoleKey[]): NavItem[] {
  const seen = new Set<string>()
  return NAV_ITEMS.filter((item) => {
    if (!item.roles.some((role) => roleKeys.includes(role))) return false
    if (seen.has(item.path)) return false
    seen.add(item.path)
    return true
  })
}

/** Where "Dashboard" (the root landing link) sends each role. */
export function getDefaultRouteForRoles(roleKeys: RoleKey[]): string {
  if (roleKeys.includes(RoleKey.SYSTEM_ADMIN) || roleKeys.includes(RoleKey.HR_ADMIN)) return ROUTES.hrAdminDashboard
  if (roleKeys.includes(RoleKey.RECRUITER)) return ROUTES.recruiterDashboard
  if (roleKeys.includes(RoleKey.HIRING_MANAGER)) return ROUTES.hiringManagerDashboard
  if (roleKeys.includes(RoleKey.INTERVIEWER)) return ROUTES.interviewerDashboard
  if (roleKeys.includes(RoleKey.CANDIDATE)) return ROUTES.candidateDashboard
  return ROUTES.login
}
