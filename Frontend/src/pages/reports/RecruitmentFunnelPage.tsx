import { Grid, Stack, Typography } from '@mui/material'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { CardSkeleton } from '@/components/common/LoadingSkeleton'
import { FunnelChart } from '@/components/common/FunnelChart'
import { ROUTES } from '@/constants/routes'
import { funnelToData, useRecruitmentFunnel } from './reportData'

function rate(numer: number, denom: number): string {
  if (!denom) return '—'
  return `${Math.round((numer / denom) * 100)}%`
}

export default function RecruitmentFunnelPage() {
  const { data: f, isLoading } = useRecruitmentFunnel()

  return (
    <>
      <PageHeader
        title="Recruitment Funnel"
        breadcrumbs={[{ label: 'Reports', to: ROUTES.reportsDashboard }, { label: 'Recruitment Funnel' }]}
      />

      <Stack spacing={2.5}>
        <SectionCard title="Candidates by Stage">
          {isLoading ? (
            <CardSkeleton height={340} />
          ) : f ? (
            <FunnelChart data={funnelToData(f)} height={340} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No funnel data available.
            </Typography>
          )}
        </SectionCard>

        <SectionCard title="Conversion Rates">
          {isLoading ? (
            <CardSkeleton height={100} />
          ) : f ? (
            <Grid container spacing={2}>
              <Conversion label="Application → Interview" value={rate(f.interviewed, f.applied)} />
              <Conversion label="Interview → Offer" value={rate(f.offered, f.interviewed)} />
              <Conversion label="Offer → Hire" value={rate(f.hired, f.offered)} />
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No data available.
            </Typography>
          )}
        </SectionCard>
      </Stack>
    </>
  )
}

function Conversion({ label, value }: { label: string; value: string }) {
  return (
    <Grid size={{ xs: 12, sm: 4 }}>
      <Stack spacing={0.5}>
        <Typography variant="h4" color="primary.main">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
    </Grid>
  )
}
