import { useState, type MouseEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconButton, Menu, MenuItem, MenuList, Stack, TextField, Typography } from '@mui/material'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusChip } from '@/components/common/StatusChip'
import { MatchScore } from '@/components/common/MatchScore'
import { AppAvatar } from '@/components/common/AppAvatar'
import { AppButton } from '@/components/common/AppButton'
import { AppPagination } from '@/components/common/AppPagination'
import { EmptyState } from '@/components/common/EmptyState'
import { AppDialog } from '@/components/common/AppDialog'
import { FormTextField } from '@/components/form/FormTextField'
import { FormSelect } from '@/components/form/FormSelect'
import { applicationApi } from '@/api/applicationApi'
import { jobApi } from '@/api/jobApi'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/utils/formatters'
import { buildPath, ROUTES } from '@/constants/routes'
import { rejectSchema, type RejectFormValues } from './schemas'
import type { ApplicantSummary, PipelineStatus } from '@/types/application'

const REJECT_REASONS = [
  { value: 'SKILLS_MISMATCH', label: 'Skills mismatch' },
  { value: 'EXPERIENCE_GAP', label: 'Insufficient experience' },
  { value: 'LOCATION', label: 'Location constraint' },
  { value: 'COMPENSATION', label: 'Compensation mismatch' },
  { value: 'OTHER', label: 'Other' },
]

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'Applied', label: 'Applied' },
  { value: 'Shortlisted', label: 'Shortlisted' },
  { value: 'OnHold', label: 'On Hold' },
  { value: 'Selected', label: 'Selected' },
  { value: 'Rejected', label: 'Rejected' },
]

export default function ViewApplicantsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { jobId } = useParams<{ jobId: string }>()
  const numericJobId = Number(jobId)

  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [menuRow, setMenuRow] = useState<ApplicantSummary | null>(null)
  const [rejectRow, setRejectRow] = useState<ApplicantSummary | null>(null)

  const { data: job } = useQuery({
    queryKey: ['job', numericJobId],
    queryFn: () => jobApi.getJob(numericJobId),
    enabled: Number.isFinite(numericJobId),
  })

  const queryKey = ['applicants', numericJobId, status, page]
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => applicationApi.getApplicants(numericJobId, { status: status || undefined, page, size: pageSize }),
    enabled: Number.isFinite(numericJobId),
  })

  const statusMutation = useMutation({
    mutationFn: ({ applicationId, ...payload }: { applicationId: number; status: PipelineStatus; reasonCode?: string; comments?: string }) =>
      applicationApi.updateStatus(applicationId, payload),
    onSuccess: (_r, vars) => {
      toast.success(`Candidate ${vars.status.toLowerCase()}.`)
      queryClient.invalidateQueries({ queryKey: ['applicants', numericJobId] })
      setRejectRow(null)
      closeMenu()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update status.'),
  })

  const rejectForm = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reasonCode: '', comments: '' },
  })

  const openMenu = (e: MouseEvent<HTMLElement>, row: ApplicantSummary) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
    setMenuRow(row)
  }
  const closeMenu = () => {
    setMenuAnchor(null)
    setMenuRow(null)
  }

  const columns: DataTableColumn<ApplicantSummary>[] = [
    {
      key: 'candidateName',
      header: 'Candidate',
      render: (r) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AppAvatar firstName={r.candidateName} size={32} />
          <Typography variant="body2" fontWeight={600}>
            {r.candidateName}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'matchScore',
      header: 'Match',
      render: (r) => (r.matchScore != null ? <MatchScore score={r.matchScore} /> : '—'),
    },
    { key: 'appliedOn', header: 'Applied', render: (r) => formatDate(r.appliedOn) },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <IconButton size="small" onClick={(e) => openMenu(e, r)} aria-label="Applicant actions">
          <MoreVertRoundedIcon fontSize="small" />
        </IconButton>
      ),
    },
  ]

  const rows = data?.data ?? []

  return (
    <>
      <PageHeader
        title="Applicants"
        description={job ? job.title : undefined}
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.recruiterDashboard },
          { label: 'Jobs', to: ROUTES.recruiterJobs },
          { label: 'Applicants' },
        ]}
        actions={
          <AppButton
            variant="outlined"
            onClick={() => navigate(buildPath(ROUTES.recruiterAiMatchResults, { jobId: numericJobId }))}
          >
            AI Match Results
          </AppButton>
        }
      />

      <SectionCard>
        <Stack spacing={2.5}>
          <TextField
            select
            label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
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
              icon={<PeopleAltOutlinedIcon fontSize="medium" />}
              title="No applicants yet"
              description="Applicants will appear here once candidates apply to this job."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(r) => r.applicationId}
              loading={isLoading}
              onRowClick={(r) =>
                r.candidateId != null &&
                navigate(buildPath(ROUTES.recruiterCandidateDetails, { candidateId: r.candidateId }))
              }
            />
          )}

          {data?.totalRecords ? (
            <AppPagination page={page} pageSize={pageSize} totalRecords={data.totalRecords} onPageChange={setPage} />
          ) : null}
        </Stack>
      </SectionCard>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuList dense sx={{ minWidth: 190 }}>
          <MenuItem
            onClick={() => {
              if (menuRow?.candidateId != null)
                navigate(buildPath(ROUTES.recruiterCandidateDetails, { candidateId: menuRow.candidateId }))
              closeMenu()
            }}
          >
            View Candidate
          </MenuItem>
          <MenuItem
            onClick={() => menuRow && statusMutation.mutate({ applicationId: menuRow.applicationId, status: 'Shortlisted' })}
          >
            Shortlist
          </MenuItem>
          <MenuItem
            onClick={() => menuRow && statusMutation.mutate({ applicationId: menuRow.applicationId, status: 'OnHold' })}
          >
            Put On Hold
          </MenuItem>
          <MenuItem
            onClick={() => menuRow && statusMutation.mutate({ applicationId: menuRow.applicationId, status: 'Selected' })}
          >
            Select
          </MenuItem>
          <MenuItem
            onClick={() => {
              rejectForm.reset({ reasonCode: '', comments: '' })
              setRejectRow(menuRow)
              setMenuAnchor(null)
            }}
            sx={{ color: 'error.main' }}
          >
            Reject
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (menuRow)
                navigate(buildPath(ROUTES.recruiterScheduleInterview, { applicationId: menuRow.applicationId }))
              closeMenu()
            }}
          >
            Schedule Interview
          </MenuItem>
        </MenuList>
      </Menu>

      {rejectRow ? (
        <AppDialog
          open={Boolean(rejectRow)}
          onClose={() => setRejectRow(null)}
          title={`Reject ${rejectRow.candidateName}`}
          actions={
            <>
              <AppButton color="inherit" onClick={() => setRejectRow(null)}>
                Cancel
              </AppButton>
              <AppButton
                variant="contained"
                color="error"
                loading={statusMutation.isPending}
                onClick={rejectForm.handleSubmit((values) =>
                  statusMutation.mutate({
                    applicationId: rejectRow.applicationId,
                    status: 'Rejected',
                    reasonCode: values.reasonCode,
                    comments: values.comments || undefined,
                  }),
                )}
              >
                Reject Candidate
              </AppButton>
            </>
          }
        >
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <FormSelect
              name="reasonCode"
              control={rejectForm.control}
              label="Reason"
              options={REJECT_REASONS}
            />
            <FormTextField
              name="comments"
              control={rejectForm.control}
              label="Comments (optional)"
              multiline
              minRows={2}
            />
          </Stack>
        </AppDialog>
      ) : null}
    </>
  )
}
