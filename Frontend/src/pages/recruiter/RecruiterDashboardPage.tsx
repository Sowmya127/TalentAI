import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, Grid, Stack, Typography } from '@mui/material'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { StatCardSkeleton, CardSkeleton } from '@/components/common/LoadingSkeleton'
import { SectionCard } from '@/components/common/SectionCard'
import { AppButton } from '@/components/common/AppButton'
import { AiInsightCard } from '@/components/common/AiInsightCard'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusChip } from '@/components/common/StatusChip'
import { dashboardApi } from '@/api/dashboardApi'
import { jobApi } from '@/api/jobApi'
import { useAuth } from '@/hooks/useAuth'
import { buildPath, ROUTES } from '@/constants/routes'
import { BRAND } from '@/theme/palette'
import type { JobDetail } from '@/types/job'

const FUNNEL_COLORS = ['#6B7C98', '#6E8296', '#7B7F8A', '#93857B', '#AB978C', '#16A34A']

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function RecruiterDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const firstName = user?.email?.split('@')[0]?.split('.')[0] ?? 'there'
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  const summaryQuery = useQuery({ queryKey: ['dashboardSummary'], queryFn: dashboardApi.summary })
  const metricsQuery = useQuery({ queryKey: ['dashboardMetrics'], queryFn: dashboardApi.metrics })
  const funnelQuery = useQuery({ queryKey: ['dashboardFunnel'], queryFn: () => dashboardApi.funnel() })
  const jobsQuery = useQuery({
    queryKey: ['recruiterActiveJobs'],
    queryFn: () => jobApi.search({ status: 'Published', page: 1, size: 5 }),
  })

  const s = summaryQuery.data
  const m = metricsQuery.data
  const f = funnelQuery.data
  const funnelData = f
    ? [
        { stage: 'Applied', value: f.applied },
        { stage: 'Screened', value: f.screened },
        { stage: 'Shortlisted', value: f.shortlisted },
        { stage: 'Interviewed', value: f.interviewed },
        { stage: 'Offered', value: f.offered },
        { stage: 'Hired', value: f.hired },
      ]
    : []

  const jobColumns: DataTableColumn<JobDetail>[] = [
    { key: 'title', header: 'Job Title', render: (r) => <Typography variant="body2" fontWeight={600}>{r.title}</Typography> },
    { key: 'department', header: 'Department', render: (r) => r.department ?? '—' },
    { key: 'location', header: 'Location' },
    { key: 'status', header: 'Status', render: (r) => (r.status ? <StatusChip status={r.status} /> : '—') },
  ]

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${displayName}`}
        description="Here's your recruitment activity at a glance."
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.recruiterDashboard }, { label: 'Recruiter' }]}
        actions={
          <AppButton variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate(ROUTES.recruiterJobCreate)}>
            Create Job
          </AppButton>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Open Positions', value: s?.openPositions, icon: <WorkOutlineIcon /> },
          { label: 'Applications', value: s?.applications, icon: <AssignmentOutlinedIcon /> },
          { label: 'Shortlisted', value: s?.shortlisted, icon: <PeopleAltOutlinedIcon /> },
          { label: 'Interviews', value: s?.interviews, icon: <EventAvailableOutlinedIcon /> },
          { label: 'Offers', value: s?.offers, icon: <LocalOfferOutlinedIcon /> },
          { label: 'Hires', value: s?.hires, icon: <CheckCircleOutlineIcon /> },
        ].map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 6, sm: 4, md: 2 }}>
            {summaryQuery.isLoading ? (
              <StatCardSkeleton />
            ) : (
              <StatCard label={kpi.label} value={kpi.value ?? 0} icon={kpi.icon} color="primary" />
            )}
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <SectionCard title="Recruitment Funnel" subtitle="Candidates by pipeline stage">
            {funnelQuery.isLoading ? (
              <CardSkeleton height={280} />
            ) : funnelData.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No funnel data available.
              </Typography>
            ) : (
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 12, right: 24 }}>
                    <CartesianGrid horizontal={false} stroke={BRAND.border} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: BRAND.slate }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      tick={{ fontSize: 12, fill: BRAND.charcoal }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(107,124,152,0.06)' }}
                      contentStyle={{ borderRadius: 10, border: `1px solid ${BRAND.border}`, fontSize: 13 }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                      {funnelData.map((_, i) => (
                        <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2.5}>
            <SectionCard title="Hiring Metrics">
              {metricsQuery.isLoading ? (
                <CardSkeleton height={140} />
              ) : (
                <Stack spacing={2}>
                  <MetricRow label="Time to Hire" value={m ? `${m.timeToHire} days` : '—'} />
                  <MetricRow label="Time to Fill" value={m ? `${m.timeToFill} days` : '—'} />
                  <MetricRow
                    label="Offer Acceptance"
                    value={m ? `${Math.round(m.offerAcceptanceRate * 100)}%` : '—'}
                  />
                </Stack>
              )}
            </SectionCard>
            <AiInsightCard title="AI Insight">
              <Typography variant="body2" color="text.primary">
                {s && s.applications > 0
                  ? `${s.shortlisted} of ${s.applications} applicants meet your shortlisting criteria. Review the top matches to keep your pipeline moving.`
                  : 'Once applications come in, AI-generated insights about your pipeline will appear here.'}
              </Typography>
            </AiInsightCard>
          </Stack>
        </Grid>

        <Grid size={12}>
          <SectionCard
            title="Active Jobs"
            actions={
              <AppButton size="small" variant="outlined" onClick={() => navigate(ROUTES.recruiterJobs)}>
                View all
              </AppButton>
            }
            noPadding
          >
            <DataTable
              columns={jobColumns}
              rows={jobsQuery.data?.data ?? []}
              rowKey={(r) => r.jobId}
              loading={jobsQuery.isLoading}
              onRowClick={(r) => navigate(buildPath(ROUTES.recruiterJobApplicants, { jobId: r.jobId }))}
              emptyTitle="No active jobs"
              emptyDescription="Create and publish a job to start receiving applications."
            />
          </SectionCard>
        </Grid>
      </Grid>
    </>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700}>
        {value}
      </Typography>
    </Stack>
  )
}
