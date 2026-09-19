import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined'
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { StatCard } from '@/components/common/StatCard'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusChip } from '@/components/common/StatusChip'
import { AppButton } from '@/components/common/AppButton'
import { reportApi } from '@/api/reportApi'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import type { HiringDecisionRow } from '@/types/report'

const RANGE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
]

export default function HiringDecisionsReportPage() {
  const toast = useToast()
  const [days, setDays] = useState(7)

  const { data, isLoading } = useQuery({
    queryKey: ['hiringDecisions', days],
    queryFn: () => reportApi.hiringDecisions(days),
  })

  const downloadMutation = useMutation({
    mutationFn: () => reportApi.downloadHiringDecisions(days),
    onSuccess: () => toast.success('Report downloaded.'),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not download the report.'),
  })

  const columns: DataTableColumn<HiringDecisionRow>[] = [
    {
      key: 'decisionDate',
      header: 'Decision Date',
      render: (r) => (r.decisionDate ? new Date(r.decisionDate).toLocaleString() : '—'),
    },
    {
      key: 'candidateName',
      header: 'Candidate',
      render: (r) => (
        <Typography variant="body2" fontWeight={600}>
          {r.candidateName ?? '—'}
        </Typography>
      ),
    },
    { key: 'email', header: 'Email', render: (r) => r.email ?? '—' },
    { key: 'jobTitle', header: 'Job', render: (r) => r.jobTitle ?? '—' },
    { key: 'decision', header: 'Decision', render: (r) => <StatusChip status={r.decision} /> },
  ]

  return (
    <>
      <PageHeader
        title="Hiring Decisions"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.hiringManagerDashboard }, { label: 'Hiring Decisions' }]}
        actions={
          <AppButton
            variant="contained"
            startIcon={<DownloadRoundedIcon />}
            loading={downloadMutation.isPending}
            disabled={!data || data.total === 0}
            onClick={() => downloadMutation.mutate()}
          >
            Download CSV
          </AppButton>
        }
      />

      <Stack spacing={2.5}>
        <TextField
          select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          label="Time range"
          sx={{ maxWidth: 220 }}
        >
          {RANGE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            {isLoading ? (
              <StatCardSkeleton />
            ) : (
              <StatCard label="Selected" value={data?.selected ?? 0} icon={<ThumbUpAltOutlinedIcon />} color="success" />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            {isLoading ? (
              <StatCardSkeleton />
            ) : (
              <StatCard label="Rejected" value={data?.rejected ?? 0} icon={<ThumbDownAltOutlinedIcon />} color="error" />
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            {isLoading ? (
              <StatCardSkeleton />
            ) : (
              <StatCard label="Total decisions" value={data?.total ?? 0} icon={<AssessmentOutlinedIcon />} color="info" />
            )}
          </Grid>
        </Grid>

        <SectionCard>
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              Decision history {data ? `(${data.from} → ${data.to})` : ''}
            </Typography>
            <DataTable
              columns={columns}
              rows={data?.rows ?? []}
              rowKey={(r) => r.applicationId}
              loading={isLoading}
              emptyTitle="No decisions in this period"
              emptyDescription="No candidates were selected or rejected in the selected time range."
            />
          </Stack>
        </SectionCard>
      </Stack>
    </>
  )
}
