import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Chip, Divider, Grid, Stack, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import PauseCircleRoundedIcon from '@mui/icons-material/PauseCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppAvatar } from '@/components/common/AppAvatar'
import { AppButton } from '@/components/common/AppButton'
import { AppDialog } from '@/components/common/AppDialog'
import { AiInsightCard } from '@/components/common/AiInsightCard'
import { FormSelect } from '@/components/form/FormSelect'
import { FormTextField } from '@/components/form/FormTextField'
import { candidateApi } from '@/api/candidateApi'
import { applicationApi } from '@/api/applicationApi'
import { useToast } from '@/hooks/useToast'
import { initialsFromFullName } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'
import { rejectSchema, type RejectFormValues } from '@/pages/recruiter/schemas'
import type { PipelineStatus } from '@/types/application'

const REJECT_REASONS = [
  { value: 'NOT_A_FIT', label: 'Not the right fit' },
  { value: 'INTERVIEW_PERFORMANCE', label: 'Interview performance' },
  { value: 'BETTER_CANDIDATE', label: 'Stronger candidate selected' },
  { value: 'OTHER', label: 'Other' },
]

export default function CandidateReviewPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const location = useLocation()
  const { applicationId } = useParams<{ applicationId: string }>()
  const numericApplicationId = Number(applicationId)
  const candidateId = (location.state as { candidateId?: number } | null)?.candidateId

  const [rejectOpen, setRejectOpen] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['candidateProfileById', candidateId],
    queryFn: () => candidateApi.getProfile(candidateId as number),
    enabled: Number.isFinite(candidateId),
  })

  const decisionMutation = useMutation({
    mutationFn: (payload: { status: PipelineStatus; reasonCode?: string; comments?: string }) =>
      applicationApi.updateStatus(numericApplicationId, payload),
    onSuccess: (_r, vars) => {
      toast.success(`Candidate ${vars.status.toLowerCase()}.`)
      setRejectOpen(false)
      navigate(ROUTES.hiringManagerDashboard)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not record the decision.'),
  })

  const rejectForm = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reasonCode: '', comments: '' },
  })

  return (
    <>
      <PageHeader
        title={profile ? `Review: ${profile.name}` : 'Candidate Review'}
        description={`Application #${numericApplicationId}`}
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.hiringManagerDashboard }, { label: 'Candidate Review' }]}
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard>
            {profile ? (
              <Stack spacing={2} alignItems="center" textAlign="center">
                <AppAvatar firstName={initialsFromFullName(profile.name)} size={72} />
                <Stack spacing={0.25}>
                  <Typography variant="h6">{profile.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile.email}
                  </Typography>
                </Stack>
                <Divider flexItem />
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={1} justifyContent="center">
                  {profile.skills.map((s) => (
                    <Chip key={s} label={s} size="small" />
                  ))}
                </Stack>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Open this review from a candidate's applicant row to load their full profile and skills here.
              </Typography>
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2.5}>
            <AiInsightCard title="AI Assessment">
              <Typography variant="body2" color="text.primary">
                Review the candidate's AI match breakdown and consolidated interview feedback before deciding. AI is
                decision support only — the hiring decision is yours.
              </Typography>
            </AiInsightCard>

            <SectionCard title="Hiring Decision">
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Record your decision for this candidate. Rejections require a reason for the audit trail.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <AppButton
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleRoundedIcon />}
                    loading={decisionMutation.isPending && decisionMutation.variables?.status === 'Selected'}
                    onClick={() => decisionMutation.mutate({ status: 'Selected' })}
                  >
                    Select Candidate
                  </AppButton>
                  <AppButton
                    variant="outlined"
                    startIcon={<PauseCircleRoundedIcon />}
                    loading={decisionMutation.isPending && decisionMutation.variables?.status === 'OnHold'}
                    onClick={() => decisionMutation.mutate({ status: 'OnHold' })}
                  >
                    Put On Hold
                  </AppButton>
                  <AppButton
                    variant="outlined"
                    color="error"
                    startIcon={<CancelRoundedIcon />}
                    onClick={() => {
                      rejectForm.reset({ reasonCode: '', comments: '' })
                      setRejectOpen(true)
                    }}
                  >
                    Reject
                  </AppButton>
                </Stack>
              </Stack>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>

      <AppDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject candidate"
        actions={
          <>
            <AppButton color="inherit" onClick={() => setRejectOpen(false)}>
              Cancel
            </AppButton>
            <AppButton
              variant="contained"
              color="error"
              loading={decisionMutation.isPending}
              onClick={rejectForm.handleSubmit((values) =>
                decisionMutation.mutate({ status: 'Rejected', reasonCode: values.reasonCode, comments: values.comments || undefined }),
              )}
            >
              Reject Candidate
            </AppButton>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <FormSelect name="reasonCode" control={rejectForm.control} label="Reason" options={REJECT_REASONS} />
          <FormTextField name="comments" control={rejectForm.control} label="Comments (optional)" multiline minRows={2} />
        </Stack>
      </AppDialog>
    </>
  )
}
