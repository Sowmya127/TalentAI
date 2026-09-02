import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stack } from '@mui/material'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusChip } from '@/components/common/StatusChip'
import { AppButton } from '@/components/common/AppButton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CandidateProfileGate } from '@/components/candidate/CandidateProfileGate'
import { applicationApi } from '@/api/applicationApi'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'
import type { CandidateApplicationSummary } from '@/types/application'
import type { CandidateProfile } from '@/types/candidate'

const WITHDRAWABLE_STATUSES = new Set(['Applied', 'Shortlisted', 'OnHold'])

function AppliedJobsBody({ profile }: { profile: CandidateProfile }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const queryKey = ['candidateApplications', profile.candidateId]
  const [withdrawing, setWithdrawing] = useState<CandidateApplicationSummary | null>(null)

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => applicationApi.getMyApplications(profile.candidateId),
  })

  const withdrawMutation = useMutation({
    mutationFn: (application: CandidateApplicationSummary) => applicationApi.withdraw(application.applicationId),
    onSuccess: () => {
      toast.success('Application withdrawn.')
      queryClient.invalidateQueries({ queryKey })
      setWithdrawing(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not withdraw this application.'),
  })

  const columns: DataTableColumn<CandidateApplicationSummary>[] = [
    { key: 'jobTitle', header: 'Job Title' },
    { key: 'status', header: 'Status', render: (row) => <StatusChip status={row.status} /> },
    { key: 'appliedOn', header: 'Applied On', render: (row) => formatDate(row.appliedOn) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) =>
        WITHDRAWABLE_STATUSES.has(row.status) ? (
          <AppButton size="small" color="error" onClick={() => setWithdrawing(row)}>
            Withdraw
          </AppButton>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader
        title="Applied Jobs"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.candidateDashboard }, { label: 'Applied Jobs' }]}
      />

      <SectionCard noPadding>
        <Stack>
          <DataTable
            columns={columns}
            rows={data?.data ?? []}
            rowKey={(row) => row.applicationId}
            loading={isLoading}
            emptyTitle="No applications yet"
            emptyDescription="Search for open roles and apply to see them here."
          />
        </Stack>
      </SectionCard>

      <ConfirmDialog
        open={Boolean(withdrawing)}
        title="Withdraw application"
        message={`Withdraw your application for "${withdrawing?.jobTitle}"? You won't be able to undo this.`}
        confirmLabel="Withdraw"
        destructive
        loading={withdrawMutation.isPending}
        onConfirm={() => withdrawing && withdrawMutation.mutate(withdrawing)}
        onCancel={() => setWithdrawing(null)}
      />
    </>
  )
}

export default function AppliedJobsPage() {
  return <CandidateProfileGate>{(profile) => <AppliedJobsBody profile={profile} />}</CandidateProfileGate>
}
