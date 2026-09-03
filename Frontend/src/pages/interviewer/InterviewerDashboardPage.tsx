import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Grid, Typography } from '@mui/material'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import { DashboardHero } from '@/components/common/DashboardHero'
import { StatCard } from '@/components/common/StatCard'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton'
import { SectionCard } from '@/components/common/SectionCard'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusChip } from '@/components/common/StatusChip'
import { AppButton } from '@/components/common/AppButton'
import { interviewApi } from '@/api/interviewApi'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime, isSameDay } from '@/utils/formatters'
import { buildPath, ROUTES } from '@/constants/routes'
import type { Interview } from '@/types/interview'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function InterviewerDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const firstName = user?.email?.split('@')[0]?.split('.')[0] ?? 'there'
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  const { data, isLoading } = useQuery({
    queryKey: ['interviewerInterviews', user?.userId],
    queryFn: () => interviewApi.list({ interviewerId: user?.userId ?? undefined, status: 'Scheduled' }),
  })

  const interviews = data?.data ?? []
  const todayCount = interviews.filter((i) => isSameDay(i.scheduledAt, new Date())).length
  const completed = interviews.filter((i) => i.status === 'Completed').length

  const columns: DataTableColumn<Interview>[] = [
    {
      key: 'candidateName',
      header: 'Candidate',
      render: (r) => <Typography variant="body2" fontWeight={600}>{r.candidateName ?? `Application #${r.applicationId}`}</Typography>,
    },
    { key: 'jobTitle', header: 'Role', render: (r) => r.jobTitle ?? '—' },
    { key: 'interviewType', header: 'Type', render: (r) => r.interviewType ?? '—' },
    { key: 'scheduledAt', header: 'Scheduled', render: (r) => formatDateTime(r.scheduledAt) },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <AppButton
          size="small"
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation()
            navigate(buildPath(ROUTES.interviewerFeedbackForm, { interviewId: r.interviewId }))
          }}
        >
          Feedback
        </AppButton>
      ),
    },
  ]

  return (
    <>
      <DashboardHero
        eyebrow={todayCount > 0 ? `${todayCount} interview${todayCount > 1 ? 's' : ''} today` : undefined}
        title={`${greeting()}, ${displayName}.`}
        subtitle="Your interview schedule and pending evaluations."
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          {isLoading ? <StatCardSkeleton /> : <StatCard label="Today's Interviews" value={todayCount} icon={<TodayOutlinedIcon />} color="primary" />}
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          {isLoading ? <StatCardSkeleton /> : <StatCard label="Upcoming" value={interviews.length} icon={<EventAvailableOutlinedIcon />} color="info" />}
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          {isLoading ? <StatCardSkeleton /> : <StatCard label="Completed" value={completed} icon={<RateReviewOutlinedIcon />} color="success" />}
        </Grid>
      </Grid>

      <SectionCard
        title="Upcoming Interviews"
        actions={
          <AppButton size="small" variant="outlined" onClick={() => navigate(ROUTES.interviewerUpcoming)}>
            View all
          </AppButton>
        }
        noPadding
      >
        <DataTable
          columns={columns}
          rows={interviews.slice(0, 6)}
          rowKey={(r) => r.interviewId}
          loading={isLoading}
          emptyTitle="No upcoming interviews"
          emptyDescription="Interviews assigned to you will appear here."
        />
      </SectionCard>
    </>
  )
}
