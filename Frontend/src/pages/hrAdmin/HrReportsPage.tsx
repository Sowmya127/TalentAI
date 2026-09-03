import { useQuery } from '@tanstack/react-query'
import { Box, Grid, Typography } from '@mui/material'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { StatCard } from '@/components/common/StatCard'
import { StatCardSkeleton, CardSkeleton } from '@/components/common/LoadingSkeleton'
import { dashboardApi } from '@/api/dashboardApi'
import { ROUTES } from '@/constants/routes'
import { BRAND } from '@/theme/palette'

const FUNNEL_COLORS = ['#14213D', '#2C3E63', '#5C6784', '#C98A2E', '#FCA311', '#16A34A']

export default function HrReportsPage() {
  const summaryQuery = useQuery({ queryKey: ['dashboardSummary'], queryFn: dashboardApi.summary })
  const metricsQuery = useQuery({ queryKey: ['dashboardMetrics'], queryFn: dashboardApi.metrics })
  const funnelQuery = useQuery({ queryKey: ['dashboardFunnel'], queryFn: () => dashboardApi.funnel() })

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

  return (
    <>
      <PageHeader
        title="Reports"
        description="Organization-wide recruitment metrics."
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.hrAdminDashboard }, { label: 'Reports' }]}
      />

      <Grid container spacing={2.5} sx={{ mb: 1 }}>
        {[
          { label: 'Open Positions', value: s ? String(s.openPositions) : '—' },
          { label: 'Time to Hire', value: m ? `${m.timeToHire} days` : '—' },
          { label: 'Offer Acceptance', value: m ? `${Math.round(m.offerAcceptanceRate * 100)}%` : '—' },
          { label: 'Total Hires', value: s ? String(s.hires) : '—' },
        ].map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 6, md: 3 }}>
            {summaryQuery.isLoading || metricsQuery.isLoading ? <StatCardSkeleton /> : <StatCard label={kpi.label} value={kpi.value} color="primary" />}
          </Grid>
        ))}
      </Grid>

      <SectionCard title="Recruitment Funnel" subtitle="Candidates by pipeline stage">
        {funnelQuery.isLoading ? (
          <CardSkeleton height={320} />
        ) : funnelData.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No funnel data available.
          </Typography>
        ) : (
          <Box sx={{ width: '100%', height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 8, left: 4, right: 8 }}>
                <CartesianGrid vertical={false} stroke={BRAND.border} />
                <XAxis dataKey="stage" tick={{ fontSize: 12, fill: BRAND.charcoal }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: BRAND.slate }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(107,124,152,0.06)' }} contentStyle={{ borderRadius: 10, border: `1px solid ${BRAND.border}`, fontSize: 13 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={44}>
                  {funnelData.map((_, i) => (
                    <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </SectionCard>
    </>
  )
}
