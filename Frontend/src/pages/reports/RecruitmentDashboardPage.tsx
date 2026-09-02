import { useNavigate } from 'react-router-dom'
import { Grid, Stack, Typography } from '@mui/material'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { StatCard } from '@/components/common/StatCard'
import { StatCardSkeleton, CardSkeleton } from '@/components/common/LoadingSkeleton'
import { AppButton } from '@/components/common/AppButton'
import { FunnelChart } from '@/components/common/FunnelChart'
import { ROUTES } from '@/constants/routes'
import { funnelToData, useDashboardSummary, useRecruitmentFunnel } from './reportData'

const SUB_REPORTS = [
  { label: 'Hiring Metrics', to: ROUTES.reportsHiringMetrics },
  { label: 'Time to Hire', to: ROUTES.reportsTimeToHire },
  { label: 'Recruitment Funnel', to: ROUTES.reportsFunnel },
  { label: 'Candidate Reports', to: ROUTES.reportsCandidates },
]

export default function RecruitmentDashboardPage() {
  const navigate = useNavigate()
  const summaryQuery = useDashboardSummary()
  const funnelQuery = useRecruitmentFunnel()
  const s = summaryQuery.data

  return (
    <>
      <PageHeader
        title="Recruitment Dashboard"
        description="A high-level view of your recruitment performance."
        breadcrumbs={[{ label: 'Reports' }]}
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Open Positions', value: s?.openPositions, icon: <WorkOutlineIcon /> },
          { label: 'Applications', value: s?.applications, icon: <AssignmentOutlinedIcon /> },
          { label: 'Interviews', value: s?.interviews, icon: <EventAvailableOutlinedIcon /> },
          { label: 'Hires', value: s?.hires, icon: <CheckCircleOutlineIcon /> },
        ].map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 6, md: 3 }}>
            {summaryQuery.isLoading ? <StatCardSkeleton /> : <StatCard label={kpi.label} value={kpi.value ?? 0} icon={kpi.icon} color="primary" />}
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <SectionCard title="Recruitment Funnel">
            {funnelQuery.isLoading ? (
              <CardSkeleton height={300} />
            ) : funnelQuery.data ? (
              <FunnelChart data={funnelToData(funnelQuery.data)} layout="vertical" height={300} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No funnel data available.
              </Typography>
            )}
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Detailed Reports">
            <Stack spacing={1.25}>
              {SUB_REPORTS.map((r) => (
                <AppButton key={r.to} variant="outlined" fullWidth onClick={() => navigate(r.to)}>
                  {r.label}
                </AppButton>
              ))}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </>
  )
}
