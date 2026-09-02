import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { PageHeader } from '@/components/common/PageHeader'
import { JobForm } from './JobForm'
import { jobApi } from '@/api/jobApi'
import { useToast } from '@/hooks/useToast'
import { buildPath, ROUTES } from '@/constants/routes'
import { parseJobForm, type JobFormValues } from './schemas'

export default function CreateJobPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const { mutate, isPending } = useMutation({
    mutationFn: (values: JobFormValues) => jobApi.createJob(parseJobForm(values)),
    onSuccess: (res) => {
      toast.success('Job requisition created as a draft.')
      navigate(buildPath(ROUTES.recruiterJobEdit, { jobId: res.jobId }))
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create the job.'),
  })

  return (
    <>
      <PageHeader
        title="Create Job"
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.recruiterDashboard },
          { label: 'Jobs', to: ROUTES.recruiterJobs },
          { label: 'Create Job' },
        ]}
      />
      <JobForm
        submitting={isPending}
        submitLabel="Create Job"
        onSubmit={(values) => mutate(values)}
        onCancel={() => navigate(ROUTES.recruiterJobs)}
      />
    </>
  )
}
