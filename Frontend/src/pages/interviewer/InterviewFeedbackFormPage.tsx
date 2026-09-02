import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Box, Divider, FormHelperText, Grid, Rating, Stack, Typography } from '@mui/material'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { FormTextField } from '@/components/form/FormTextField'
import { FormSelect } from '@/components/form/FormSelect'
import { AppButton } from '@/components/common/AppButton'
import { interviewApi } from '@/api/interviewApi'
import { useToast } from '@/hooks/useToast'
import { formatDateTime } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'
import { feedbackSchema, type FeedbackFormValues } from './schemas'

const RECOMMENDATIONS = [
  { value: 'StrongHire', label: 'Strong Hire' },
  { value: 'Hire', label: 'Hire' },
  { value: 'Hold', label: 'Hold' },
  { value: 'Reject', label: 'Reject' },
]

const CRITERIA: { name: keyof FeedbackFormValues; label: string }[] = [
  { name: 'technical', label: 'Technical Skills' },
  { name: 'communication', label: 'Communication' },
  { name: 'problemSolving', label: 'Problem Solving' },
  { name: 'domainKnowledge', label: 'Domain Knowledge' },
]

export default function InterviewFeedbackFormPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { interviewId } = useParams<{ interviewId: string }>()
  const numericId = Number(interviewId)

  const { data: interview } = useQuery({
    queryKey: ['interview', numericId],
    queryFn: () => interviewApi.getInterview(numericId),
    enabled: Number.isFinite(numericId),
  })

  const { control, handleSubmit } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      technical: 0,
      communication: 0,
      problemSolving: 0,
      domainKnowledge: 0,
      comments: '',
      recommendation: '',
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FeedbackFormValues) => interviewApi.submitFeedback(numericId, values),
    onSuccess: () => {
      toast.success('Feedback submitted.')
      navigate(ROUTES.interviewerUpcoming)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not submit feedback.'),
  })

  return (
    <>
      <PageHeader
        title="Interview Feedback"
        description={interview ? `${interview.candidateName ?? 'Candidate'} · ${formatDateTime(interview.scheduledAt)}` : undefined}
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.interviewerDashboard },
          { label: 'Upcoming Interviews', to: ROUTES.interviewerUpcoming },
          { label: 'Feedback' },
        ]}
      />

      <SectionCard title="Evaluation Scorecard">
        <Stack component="form" onSubmit={handleSubmit((v) => mutate(v))} spacing={3} sx={{ maxWidth: 640 }}>
          <Stack spacing={2} divider={<Divider flexItem />}>
            {CRITERIA.map((c) => (
              <Controller
                key={c.name}
                name={c.name}
                control={control}
                render={({ field, fieldState }) => (
                  <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {c.label}
                    </Typography>
                    <Box>
                      <Rating
                        value={Number(field.value) || 0}
                        onChange={(_e, val) => field.onChange(val ?? 0)}
                        max={5}
                      />
                      {fieldState.error ? (
                        <FormHelperText error>{fieldState.error.message}</FormHelperText>
                      ) : null}
                    </Box>
                  </Stack>
                )}
              />
            ))}
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormSelect name="recommendation" control={control} label="Recommendation" options={RECOMMENDATIONS} />
            </Grid>
          </Grid>

          <FormTextField
            name="comments"
            control={control}
            label="Comments"
            multiline
            minRows={4}
            helperText="Summarize strengths, concerns, and evidence from the interview."
          />

          <Stack direction="row" spacing={1.5}>
            <AppButton type="submit" variant="contained" loading={isPending}>
              Submit Feedback
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
