import { Grid, Stack, Typography } from '@mui/material'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded'
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { StatCard } from '@/components/common/StatCard'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton'
import { ROUTES } from '@/constants/routes'
import { useHiringMetrics } from './reportData'

export default function HiringMetricsPage() {
  const { data: m, isLoading } = useHiringMetrics()

  return (
    <>
      <PageHeader
        title="Hiring Metrics"
        breadcrumbs={[{ label: 'Reports', to: ROUTES.reportsDashboard }, { label: 'Hiring Metrics' }]}
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          {isLoading ? <StatCardSkeleton /> : <StatCard label="Time to Hire" value={m ? `${m.timeToHire} days` : '—'} icon={<AccessTimeRoundedIcon />} color="primary" />}
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          {isLoading ? <StatCardSkeleton /> : <StatCard label="Time to Fill" value={m ? `${m.timeToFill} days` : '—'} icon={<EventRepeatRoundedIcon />} color="info" />}
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          {isLoading ? <StatCardSkeleton /> : <StatCard label="Offer Acceptance" value={m ? `${Math.round(m.offerAcceptanceRate * 100)}%` : '—'} icon={<ThumbUpAltOutlinedIcon />} color="success" />}
        </Grid>
      </Grid>

      <SectionCard title="What these mean">
        <Stack spacing={1.5}>
          <Metric label="Time to Hire" text="Average days from a candidate applying to accepting an offer." />
          <Metric label="Time to Fill" text="Average days from opening a requisition to filling the position." />
          <Metric label="Offer Acceptance Rate" text="Share of extended offers that candidates accept." />
        </Stack>
      </SectionCard>
    </>
  )
}

function Metric({ label, text }: { label: string; text: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="subtitle2" fontWeight={700}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Stack>
  )
}
