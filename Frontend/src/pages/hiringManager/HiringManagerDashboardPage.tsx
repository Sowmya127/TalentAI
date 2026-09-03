import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Grid, Stack, Typography } from '@mui/material'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { DashboardHero } from '@/components/common/DashboardHero'
import { StatCard } from '@/components/common/StatCard'
import { StatCardSkeleton, CardSkeleton } from '@/components/common/LoadingSkeleton'
import { SectionCard } from '@/components/common/SectionCard'
import { AppButton } from '@/components/common/AppButton'
import { AiInsightCard } from '@/components/common/AiInsightCard'
import { dashboardApi } from '@/api/dashboardApi'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function HiringManagerDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const firstName = user?.email?.split('@')[0]?.split('.')[0] ?? 'there'
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  const summaryQuery = useQuery({ queryKey: ['dashboardSummary'], queryFn: dashboardApi.summary })
  const metricsQuery = useQuery({ queryKey: ['dashboardMetrics'], queryFn: dashboardApi.metrics })

  const s = summaryQuery.data
  const m = metricsQuery.data

  return (
    <>
      <DashboardHero
        eyebrow={s?.shortlisted ? `${s.shortlisted} candidate${s.shortlisted > 1 ? 's' : ''} awaiting your decision` : undefined}
        title={`${greeting()}, ${displayName}.`}
        subtitle="Candidates and offers awaiting your decision."
        action={
          <Stack direction="row" spacing={1.5}>
            <AppButton variant="contained" color="secondary" onClick={() => navigate(ROUTES.hiringManagerJobApprovals)}>
              Requisition Approvals
            </AppButton>
            <AppButton
              variant="outlined"
              color="inherit"
              sx={{ borderColor: 'rgba(255,255,255,0.4)' }}
              onClick={() => navigate(ROUTES.reportsDashboard)}
            >
              View Reports
            </AppButton>
          </Stack>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          {summaryQuery.isLoading ? <StatCardSkeleton /> : <StatCard label="Shortlisted" value={s?.shortlisted ?? 0} icon={<PeopleAltOutlinedIcon />} color="primary" />}
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          {summaryQuery.isLoading ? <StatCardSkeleton /> : <StatCard label="Interviews" value={s?.interviews ?? 0} icon={<EventAvailableOutlinedIcon />} color="info" />}
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          {summaryQuery.isLoading ? <StatCardSkeleton /> : <StatCard label="Offers" value={s?.offers ?? 0} icon={<LocalOfferOutlinedIcon />} color="warning" />}
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          {summaryQuery.isLoading ? <StatCardSkeleton /> : <StatCard label="Hires" value={s?.hires ?? 0} icon={<CheckCircleOutlineIcon />} color="success" />}
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <SectionCard title="How reviews reach you">
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Recruiters hand off shortlisted candidates and generated offers for your decision. Open a candidate's
                review to see their profile, AI assessment, and consolidated interview feedback before selecting,
                holding, or rejecting — and approve or reject offers once compensation is set.
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          {metricsQuery.isLoading ? (
            <CardSkeleton height={140} />
          ) : (
            <AiInsightCard title="Hiring Snapshot">
              <Typography variant="body2" color="text.primary">
                {m
                  ? `Average time to hire is ${m.timeToHire} days with a ${Math.round(m.offerAcceptanceRate * 100)}% offer acceptance rate. Faster decisions on shortlisted candidates keep strong applicants engaged.`
                  : 'Hiring metrics will appear here once data is available.'}
              </Typography>
            </AiInsightCard>
          )}
        </Grid>
      </Grid>
    </>
  )
}
