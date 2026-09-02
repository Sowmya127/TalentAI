import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stack, Typography } from '@mui/material'
import PlaylistAddCheckRoundedIcon from '@mui/icons-material/PlaylistAddCheckRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { MatchScore } from '@/components/common/MatchScore'
import { AppAvatar } from '@/components/common/AppAvatar'
import { StatusChip } from '@/components/common/StatusChip'
import { AppButton } from '@/components/common/AppButton'
import { EmptyState } from '@/components/common/EmptyState'
import { applicationApi } from '@/api/applicationApi'
import { jobApi } from '@/api/jobApi'
import { useToast } from '@/hooks/useToast'
import { buildPath, ROUTES } from '@/constants/routes'
import type { ApplicantSummary } from '@/types/application'

export default function ShortlistCandidatesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { jobId } = useParams<{ jobId: string }>()
  const numericJobId = Number(jobId)

  const { data: job } = useQuery({
    queryKey: ['job', numericJobId],
    queryFn: () => jobApi.getJob(numericJobId),
    enabled: Number.isFinite(numericJobId),
  })

  const queryKey = ['shortlistApplicants', numericJobId]
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => applicationApi.getApplicants(numericJobId, { status: 'Applied', page: 1, size: 50 }),
    enabled: Number.isFinite(numericJobId),
  })

  const shortlistMutation = useMutation({
    mutationFn: (applicationId: number) => applicationApi.updateStatus(applicationId, { status: 'Shortlisted' }),
    onSuccess: () => {
      toast.success('Candidate shortlisted.')
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not shortlist candidate.'),
  })

  const rows = [...(data?.data ?? [])].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))

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
    { key: 'matchScore', header: 'Match', width: 180, render: (r) => (r.matchScore != null ? <MatchScore score={r.matchScore} showBar /> : '—') },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <AppButton
          size="small"
          variant="contained"
          loading={shortlistMutation.isPending && shortlistMutation.variables === r.applicationId}
          onClick={(e) => {
            e.stopPropagation()
            shortlistMutation.mutate(r.applicationId)
          }}
        >
          Shortlist
        </AppButton>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Shortlist Candidates"
        description={job?.title}
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.recruiterDashboard },
          { label: 'Jobs', to: ROUTES.recruiterJobs },
          { label: 'Shortlist' },
        ]}
        actions={
          <AppButton
            variant="outlined"
            onClick={() => navigate(buildPath(ROUTES.recruiterAiMatchResults, { jobId: numericJobId }))}
          >
            View AI Ranking
          </AppButton>
        }
      />

      <SectionCard title="Applicants awaiting review" subtitle="Sorted by AI match score" noPadding>
        {!isLoading && rows.length === 0 ? (
          <EmptyState
            icon={<PlaylistAddCheckRoundedIcon fontSize="medium" />}
            title="Nothing to review"
            description="All applicants for this job have already been actioned."
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
      </SectionCard>
    </>
  )
}
