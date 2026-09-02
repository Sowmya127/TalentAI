import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Grid, Stack } from '@mui/material'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { FormTextField } from '@/components/form/FormTextField'
import { FormSelect } from '@/components/form/FormSelect'
import { AppButton } from '@/components/common/AppButton'
import { interviewApi } from '@/api/interviewApi'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import { scheduleInterviewSchema, type ScheduleInterviewFormValues } from './schemas'

const INTERVIEW_TYPES = [
  { value: 'PhoneScreen', label: 'Phone Screen' },
  { value: 'Technical', label: 'Technical' },
  { value: 'HR', label: 'HR' },
  { value: 'Managerial', label: 'Managerial' },
  { value: 'Panel', label: 'Panel' },
]

const MODES = [
  { value: 'Video', label: 'Video' },
  { value: 'Phone', label: 'Phone' },
  { value: 'Onsite', label: 'Onsite' },
]

export default function ScheduleInterviewPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { applicationId } = useParams<{ applicationId: string }>()
  const numericApplicationId = Number(applicationId)

  const { control, handleSubmit } = useForm<ScheduleInterviewFormValues>({
    resolver: zodResolver(scheduleInterviewSchema),
    defaultValues: {
      interviewType: 'Technical',
      interviewerId: '',
      scheduledAt: dayjs().add(1, 'day').hour(10).minute(0).format('YYYY-MM-DDTHH:mm'),
      durationMinutes: '60',
      mode: 'Video',
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ScheduleInterviewFormValues) =>
      interviewApi.schedule({
        applicationId: numericApplicationId,
        interviewType: values.interviewType,
        interviewerId: Number(values.interviewerId),
        // The form gives a local datetime; send it with the local offset.
        scheduledAt: dayjs(values.scheduledAt).format(),
        durationMinutes: Number(values.durationMinutes),
        mode: values.mode,
      }),
    onSuccess: () => {
      toast.success('Interview scheduled.')
      navigate(-1)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not schedule the interview.'),
  })

  return (
    <>
      <PageHeader
        title="Schedule Interview"
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.recruiterDashboard },
          { label: 'Jobs', to: ROUTES.recruiterJobs },
          { label: 'Schedule Interview' },
        ]}
      />

      <SectionCard title="Interview Details">
        <Stack component="form" onSubmit={handleSubmit((v) => mutate(v))} spacing={2.5} sx={{ maxWidth: 620 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormSelect name="interviewType" control={control} label="Interview type" options={INTERVIEW_TYPES} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormSelect name="mode" control={control} label="Mode" options={MODES} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                name="scheduledAt"
                control={control}
                label="Date & time"
                type="datetime-local"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormTextField name="durationMinutes" control={control} label="Duration (min)" type="number" />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormTextField name="interviewerId" control={control} label="Interviewer ID" type="number" />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1.5}>
            <AppButton type="submit" variant="contained" loading={isPending}>
              Schedule Interview
            </AppButton>
            <AppButton color="inherit" onClick={() => navigate(-1)}>
              Cancel
            </AppButton>
          </Stack>
        </Stack>
      </SectionCard>
    </>
  )
}
