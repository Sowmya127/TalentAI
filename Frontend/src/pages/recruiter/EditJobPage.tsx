import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stack } from '@mui/material'
import PublishRoundedIcon from '@mui/icons-material/PublishRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { StatusChip } from '@/components/common/StatusChip'
import { AppButton } from '@/components/common/AppButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { JobForm } from './JobForm'
import { jobApi } from '@/api/jobApi'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import { parseJobForm, type JobFormValues } from './schemas'

export default function EditJobPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { jobId } = useParams<{ jobId: string }>()
  const numericJobId = Number(jobId)

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', numericJobId],
    queryFn: () => jobApi.getJob(numericJobId),
    enabled: Number.isFinite(numericJobId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['job', numericJobId] })
    queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] })
  }

  const updateMutation = useMutation({
    mutationFn: (values: JobFormValues) => jobApi.updateJob(numericJobId, parseJobForm(values)),
    onSuccess: () => {
      toast.success('Job updated.')
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update the job.'),
  })

  const submitMutation = useMutation({
    mutationFn: () => jobApi.submit(numericJobId),
    onSuccess: () => {
      toast.success('Submitted for approval.')
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not submit the job.'),
  })

  const publishMutation = useMutation({
    mutationFn: () => jobApi.publish(numericJobId),
    onSuccess: () => {
      toast.success('Job published.')
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not publish. It must be approved first.'),
  })

  if (isLoading) return <LoadingSpinner fullPage label="Loading job…" />
  if (!job) {
    return (
      <SectionCard>
        <EmptyState title="Job not found" description="This requisition may have been removed." />
      </SectionCard>
    )
  }

  const isDraft = job.status === 'Draft'
  const isApproved = job.status === 'Approved'

  return (
    <>
      <PageHeader
        title={`Edit: ${job.title}`}
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.recruiterDashboard },
          { label: 'Jobs', to: ROUTES.recruiterJobs },
          { label: 'Edit Job' },
        ]}
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center">
            {job.status ? <StatusChip status={job.status} /> : null}
            {isDraft ? (
              <AppButton
                variant="outlined"
                startIcon={<SendRoundedIcon />}
                loading={submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                Submit for Approval
              </AppButton>
            ) : null}
            {isApproved ? (
              <AppButton
                variant="contained"
                startIcon={<PublishRoundedIcon />}
                loading={publishMutation.isPending}
                onClick={() => publishMutation.mutate()}
              >
                Publish
              </AppButton>
            ) : null}
          </Stack>
        }
      />

      {!isDraft ? (
        <SectionCard>
          <EmptyState
            title="This job can no longer be edited"
            description={`Editing is only allowed while a requisition is in Draft. Current status: ${job.status}.`}
          />
        </SectionCard>
      ) : (
        <JobForm
          submitting={updateMutation.isPending}
          submitLabel="Save Changes"
          defaultValues={{
            title: job.title,
            department: job.department ?? '',
            location: job.location,
            employmentType: job.employmentType ?? 'Full-Time',
            requiredSkills: job.requiredSkills.join(', '),
            preferredSkills: job.preferredSkills.join(', '),
            minExperience: job.minExperience != null ? String(job.minExperience) : '',
            maxExperience: job.maxExperience != null ? String(job.maxExperience) : '',
          }}
          onSubmit={(values) => updateMutation.mutate(values)}
          onCancel={() => navigate(ROUTES.recruiterJobs)}
        />
      )}
    </>
  )
}
