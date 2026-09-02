import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Grid, Stack } from '@mui/material'
import { SectionCard } from '@/components/common/SectionCard'
import { FormTextField } from '@/components/form/FormTextField'
import { FormSelect } from '@/components/form/FormSelect'
import { AppButton } from '@/components/common/AppButton'
import { jobSchema, type JobFormValues } from './schemas'

const EMPLOYMENT_TYPES = [
  { value: 'Full-Time', label: 'Full-Time' },
  { value: 'Part-Time', label: 'Part-Time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Temporary', label: 'Temporary' },
]

interface JobFormProps {
  defaultValues?: Partial<JobFormValues>
  submitting?: boolean
  submitLabel?: string
  onSubmit: (values: JobFormValues) => void
  onCancel: () => void
}

export function JobForm({ defaultValues, submitting, submitLabel = 'Save', onSubmit, onCancel }: JobFormProps) {
  const { control, handleSubmit } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      department: '',
      location: '',
      employmentType: 'Full-Time',
      requiredSkills: '',
      preferredSkills: '',
      minExperience: '',
      maxExperience: '',
      hiringManagerId: '',
      recruiterId: '',
      ...defaultValues,
    },
  })

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5}>
      <SectionCard title="Job Details">
        <Grid container spacing={2}>
          <Grid size={12}>
            <FormTextField name="title" control={control} label="Job title" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField name="department" control={control} label="Department" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField name="location" control={control} label="Location" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormSelect name="employmentType" control={control} label="Employment type" options={EMPLOYMENT_TYPES} />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Requirements">
        <Grid container spacing={2}>
          <Grid size={12}>
            <FormTextField
              name="requiredSkills"
              control={control}
              label="Required skills"
              helperText="Comma-separated, e.g. Java, Spring Boot, REST APIs"
            />
          </Grid>
          <Grid size={12}>
            <FormTextField
              name="preferredSkills"
              control={control}
              label="Preferred skills (optional)"
              helperText="Comma-separated, e.g. AWS, Kafka"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormTextField name="minExperience" control={control} label="Min experience (yrs)" type="number" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormTextField name="maxExperience" control={control} label="Max experience (yrs)" type="number" />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Assignment">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField name="hiringManagerId" control={control} label="Hiring manager ID" type="number" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField name="recruiterId" control={control} label="Recruiter ID" type="number" />
          </Grid>
        </Grid>
      </SectionCard>

      <Stack direction="row" spacing={1.5}>
        <AppButton type="submit" variant="contained" loading={submitting}>
          {submitLabel}
        </AppButton>
        <AppButton color="inherit" onClick={onCancel}>
          Cancel
        </AppButton>
      </Stack>
    </Stack>
  )
}
