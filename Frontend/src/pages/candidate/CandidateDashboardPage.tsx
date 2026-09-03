import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Grid, Stack } from '@mui/material'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import HourglassTopOutlinedIcon from '@mui/icons-material/HourglassTopOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { DashboardHero } from '@/components/common/DashboardHero'
import { SectionCard } from '@/components/common/SectionCard'
import { StatCard } from '@/components/common/StatCard'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusChip } from '@/components/common/StatusChip'
import { AppButton } from '@/components/common/AppButton'
import { CandidateProfileGate } from '@/components/candidate/CandidateProfileGate'
import { applicationApi } from '@/api/applicationApi'
import { jobApi } from '@/api/jobApi'
import { formatDate } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'
import type { CandidateApplicationSummary } from '@/types/application'
import type { CandidateProfile } from '@/types/candidate'

const columns: DataTableColumn<CandidateApplicationSummary>[] = [
  { key: 'jobTitle', header: 'Job Title' },
  { key: 'status', header: 'Status', render: (row) => <StatusChip status={row.status} /> },
  { key: 'appliedOn', header: 'Applied On', render: (row) => formatDate(row.appliedOn) },
]

function DashboardBody({ profile }: { profile: CandidateProfile }) {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['candidateApplications', profile.candidateId],
    queryFn: () => applicationApi.getMyApplications(profile.candidateId),
  })
  const openRolesQuery = useQuery({
    queryKey: ['openRolesCount'],
    queryFn: () => jobApi.search({ status: 'Published', page: 1, size: 1 }),
  })

  const applications = data?.data ?? []
  const shortlisted = applications.filter((a) => a.status === 'Shortlisted').length
  const inProgress = applications.filter((a) => !['Rejected', 'Withdrawn', 'Selected'].includes(a.status)).length
  const openRoles = openRolesQuery.data?.totalRecords

  const subtitle =
    shortlisted > 0
      ? `${shortlisted} role${shortlisted > 1 ? 's' : ''} already shortlisted — keep the momentum before the coffee gets cold.`
      : "Here's where things stand with your job search."

  return (
    <>
      <DashboardHero
        eyebrow={openRoles ? `${openRoles} role${openRoles > 1 ? 's' : ''} open right now` : undefined}
        title={`Welcome back, ${profile.name.split(' ')[0]}.`}
        subtitle={subtitle}
        action={
          <AppButton
            variant="contained"
            color="secondary"
            startIcon={<SearchRoundedIcon />}
            onClick={() => navigate(ROUTES.candidateJobSearch)}
          >
            Search Jobs
          </AppButton>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          {isLoading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              label="Total Applications"
              value={applications.length}
              caption="Across all roles"
              icon={<AssignmentTurnedInOutlinedIcon />}
              color="primary"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          {isLoading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              label="In Progress"
              value={inProgress}
              caption="Awaiting recruiter review"
              icon={<HourglassTopOutlinedIcon />}
              color="info"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          {isLoading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              label="Shortlisted"
              value={shortlisted}
              caption={shortlisted > 0 ? 'Interview likely next' : 'None yet'}
              icon={<TaskAltOutlinedIcon />}
              color="success"
            />
          )}
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <SectionCard title="Recent Applications" noPadding>
            <DataTable
              columns={columns}
              rows={applications.slice(0, 5)}
              rowKey={(row) => row.applicationId}
              loading={isLoading}
              emptyTitle="No applications yet"
              emptyDescription="Search for open roles and apply to see them here."
            />
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Quick Actions">
            <Stack spacing={1.5}>
              <AppButton
                variant="outlined"
                fullWidth
                startIcon={<UploadFileRoundedIcon />}
                onClick={() => navigate(ROUTES.candidateResume)}
              >
                Upload Resume
              </AppButton>
              <AppButton
                variant="outlined"
                fullWidth
                startIcon={<EditRoundedIcon />}
                onClick={() => navigate(ROUTES.candidateProfileEdit)}
              >
                Edit Profile
              </AppButton>
              <AppButton
                variant="outlined"
                fullWidth
                startIcon={<AssignmentTurnedInOutlinedIcon />}
                onClick={() => navigate(ROUTES.candidateApplications)}
              >
                View All Applications
              </AppButton>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </>
  )
}

export default function CandidateDashboardPage() {
  return <CandidateProfileGate>{(profile) => <DashboardBody profile={profile} />}</CandidateProfileGate>
}
