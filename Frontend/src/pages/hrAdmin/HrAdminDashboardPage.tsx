import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Grid, Stack, Typography } from '@mui/material'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import type { ComponentType } from 'react'
import { DashboardHero } from '@/components/common/DashboardHero'
import { StatCard } from '@/components/common/StatCard'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton'
import { SectionCard } from '@/components/common/SectionCard'
import { dashboardApi } from '@/api/dashboardApi'
import { userApi } from '@/api/userApi'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const QUICK_LINKS: { label: string; description: string; icon: ComponentType; to: string }[] = [
  { label: 'User Management', description: 'Create and manage internal accounts', icon: GroupOutlinedIcon, to: ROUTES.hrAdminUsers },
  { label: 'Registration Approvals', description: 'Review pending self-registrations', icon: HowToRegOutlinedIcon, to: ROUTES.hrAdminRegistrations },
  { label: 'Role Management', description: 'Define roles and permissions', icon: AdminPanelSettingsOutlinedIcon, to: ROUTES.hrAdminRoles },
  { label: 'Notifications', description: 'Trigger and review notifications', icon: NotificationsActiveOutlinedIcon, to: ROUTES.hrAdminNotifications },
  { label: 'Audit Logs', description: 'Review significant system actions', icon: HistoryOutlinedIcon, to: ROUTES.hrAdminAuditLogs },
]

export default function HrAdminDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const firstName = user?.email?.split('@')[0]?.split('.')[0] ?? 'Admin'
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  const usersQuery = useQuery({ queryKey: ['usersTotal'], queryFn: () => userApi.searchUsers({ page: 0, size: 1 }) })
  const summaryQuery = useQuery({ queryKey: ['dashboardSummary'], queryFn: dashboardApi.summary })

  const s = summaryQuery.data

  return (
    <>
      <DashboardHero
        eyebrow={usersQuery.data?.totalElements ? `${usersQuery.data.totalElements} users in the system` : undefined}
        title={`${greeting()}, ${displayName}.`}
        subtitle="System administration and recruitment oversight."
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          {usersQuery.isLoading ? <StatCardSkeleton /> : <StatCard label="Total Users" value={usersQuery.data?.totalElements ?? 0} icon={<GroupOutlinedIcon />} color="primary" />}
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          {summaryQuery.isLoading ? <StatCardSkeleton /> : <StatCard label="Open Positions" value={s?.openPositions ?? 0} icon={<WorkOutlineIcon />} color="info" />}
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          {summaryQuery.isLoading ? <StatCardSkeleton /> : <StatCard label="Applications" value={s?.applications ?? 0} icon={<AssignmentOutlinedIcon />} color="secondary" />}
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          {summaryQuery.isLoading ? <StatCardSkeleton /> : <StatCard label="Hires" value={s?.hires ?? 0} icon={<CheckCircleOutlineIcon />} color="success" />}
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon
          return (
            <Grid key={link.to} size={{ xs: 12, sm: 6, md: 3 }}>
              <SectionCard>
                <Stack spacing={1.5} onClick={() => navigate(link.to)} sx={{ cursor: 'pointer', height: '100%' }}>
                  <Icon />
                  <Typography variant="subtitle1" fontWeight={700}>
                    {link.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {link.description}
                  </Typography>
                </Stack>
              </SectionCard>
            </Grid>
          )
        })}
      </Grid>
    </>
  )
}
