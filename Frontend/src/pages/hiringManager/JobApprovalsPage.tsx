import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Chip, Stack, Typography } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusChip } from '@/components/common/StatusChip'
import { AppButton } from '@/components/common/AppButton'
import { EmptyState } from '@/components/common/EmptyState'
import { jobApi } from '@/api/jobApi'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import type { JobDetail } from '@/types/job'

const PENDING_QUERY_KEY = ['hiringManagerPendingJobs']

export default function JobApprovalsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [pendingId, setPendingId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: PENDING_QUERY_KEY,
    queryFn: () => jobApi.search({ status: 'PendingApproval', page: 1, size: 50 }),
  })

  const decisionMutation = useMutation({
    mutationFn: ({ job, decision }: { job: JobDetail; decision: 'Approved' | 'Rejected' }) =>
      jobApi.approve(job.jobId, { decision }),
    onMutate: ({ job }) => setPendingId(job.jobId),
    onSuccess: (_res, { decision }) => {
      toast.success(decision === 'Approved' ? 'Requisition approved. The recruiter can now publish it.' : 'Requisition sent back to draft.')
      queryClient.invalidateQueries({ queryKey: PENDING_QUERY_KEY })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not record your decision.'),
    onSettled: () => setPendingId(null),
  })

  const jobs = data?.data ?? []

  const columns: DataTableColumn<JobDetail>[] = [
    {
      key: 'title',
      header: 'Job Title',
      render: (r) => (
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={600}>
            {r.title}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {r.requiredSkills.slice(0, 4).map((s) => (
              <Chip key={s} label={s} size="small" variant="outlined" />
            ))}
          </Stack>
        </Stack>
      ),
    },
    { key: 'department', header: 'Department', render: (r) => r.department ?? '—' },
    { key: 'location', header: 'Location' },
    {
      key: 'experience',
      header: 'Experience',
      render: (r) =>
        r.minExperience != null || r.maxExperience != null ? `${r.minExperience ?? 0}–${r.maxExperience ?? '—'} yrs` : '—',
    },
    { key: 'status', header: 'Status', render: (r) => (r.status ? <StatusChip status={r.status} /> : '—') },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <AppButton
            size="small"
            variant="contained"
            startIcon={<CheckRoundedIcon />}
            loading={decisionMutation.isPending && pendingId === r.jobId}
            disabled={decisionMutation.isPending}
            onClick={() => decisionMutation.mutate({ job: r, decision: 'Approved' })}
          >
            Approve
          </AppButton>
          <AppButton
            size="small"
            color="inherit"
            startIcon={<CloseRoundedIcon />}
            disabled={decisionMutation.isPending}
            onClick={() => decisionMutation.mutate({ job: r, decision: 'Rejected' })}
          >
            Reject
          </AppButton>
        </Stack>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Requisition Approvals"
        description="Job requisitions submitted by recruiters, awaiting your approval before they can be published."
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.hiringManagerDashboard },
          { label: 'Requisition Approvals' },
        ]}
      />

      <SectionCard>
        {!isLoading && jobs.length === 0 ? (
          <EmptyState
            icon={<FactCheckOutlinedIcon fontSize="medium" />}
            title="Nothing awaiting approval"
            description="When a recruiter submits a job requisition for approval, it will appear here."
          />
        ) : (
          <DataTable columns={columns} rows={jobs} rowKey={(r) => r.jobId} loading={isLoading} />
        )}
      </SectionCard>
    </>
  )
}
