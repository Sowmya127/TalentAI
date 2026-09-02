import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MenuItem, Stack, TextField, Typography } from '@mui/material'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusChip } from '@/components/common/StatusChip'
import { AppButton } from '@/components/common/AppButton'
import { EmptyState } from '@/components/common/EmptyState'
import { interviewApi } from '@/api/interviewApi'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime } from '@/utils/formatters'
import { buildPath, ROUTES } from '@/constants/routes'
import type { Interview, InterviewStatus } from '@/types/interview'

const STATUS_FILTERS = [
  { value: 'Scheduled', label: 'Scheduled' },
  { value: '', label: 'All' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Rescheduled', label: 'Rescheduled' },
  { value: 'Cancelled', label: 'Cancelled' },
]

export default function UpcomingInterviewsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [status, setStatus] = useState<string>('Scheduled')

  const { data, isLoading } = useQuery({
    queryKey: ['interviewerInterviews', user?.userId, status],
    queryFn: () =>
      interviewApi.list({
        interviewerId: user?.userId ?? undefined,
        status: (status || undefined) as InterviewStatus | undefined,
      }),
  })

  const columns: DataTableColumn<Interview>[] = [
    {
      key: 'candidateName',
      header: 'Candidate',
      render: (r) => <Typography variant="body2" fontWeight={600}>{r.candidateName ?? `Application #${r.applicationId}`}</Typography>,
    },
    { key: 'jobTitle', header: 'Role', render: (r) => r.jobTitle ?? '—' },
    { key: 'interviewType', header: 'Type', render: (r) => r.interviewType ?? '—' },
    { key: 'mode', header: 'Mode', render: (r) => r.mode ?? '—' },
    { key: 'scheduledAt', header: 'Scheduled', render: (r) => formatDateTime(r.scheduledAt) },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <AppButton
          size="small"
          variant="contained"
          onClick={() => navigate(buildPath(ROUTES.interviewerFeedbackForm, { interviewId: r.interviewId }))}
        >
          Submit Feedback
        </AppButton>
      ),
    },
  ]

  const rows = data?.data ?? []

  return (
    <>
      <PageHeader
        title="Upcoming Interviews"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.interviewerDashboard }, { label: 'Upcoming Interviews' }]}
      />

      <SectionCard>
        <Stack spacing={2.5}>
          <TextField
            select
            label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ maxWidth: 220 }}
          >
            {STATUS_FILTERS.map((f) => (
              <MenuItem key={f.value} value={f.value}>
                {f.label}
              </MenuItem>
            ))}
          </TextField>

          {!isLoading && rows.length === 0 ? (
            <EmptyState
              icon={<EventAvailableOutlinedIcon fontSize="medium" />}
              title="No interviews"
              description="Interviews assigned to you will appear here once scheduled."
            />
          ) : (
            <DataTable columns={columns} rows={rows} rowKey={(r) => r.interviewId} loading={isLoading} />
          )}
        </Stack>
      </SectionCard>
    </>
  )
}
