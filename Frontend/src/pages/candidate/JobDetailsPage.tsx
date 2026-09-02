import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Chip, Divider, Grid, Stack, Typography } from '@mui/material'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppButton } from '@/components/common/AppButton'
import { StatusChip } from '@/components/common/StatusChip'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { CandidateProfileGate } from '@/components/candidate/CandidateProfileGate'
import { jobApi } from '@/api/jobApi'
import { applicationApi } from '@/api/applicationApi'
import { useToast } from '@/hooks/useToast'
import { buildPath, ROUTES } from '@/constants/routes'
import type { CandidateProfile } from '@/types/candidate'

function JobDetailsBody({ profile }: { profile: CandidateProfile }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { jobId } = useParams<{ jobId: string }>()
  const numericJobId = Number(jobId)

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', numericJobId],
    queryFn: () => jobApi.getJob(numericJobId),
    enabled: Number.isFinite(numericJobId),
  })

  const applyMutation = useMutation({
    mutationFn: () => applicationApi.apply(numericJobId, { candidateId: profile.candidateId }),
    onSuccess: () => {
      navigate(buildPath(ROUTES.candidateApplicationConfirmation, { jobId: numericJobId }), {
        state: { jobTitle: job?.title },
      })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not submit your application.'),
  })

  if (isLoading) {
    return <LoadingSpinner fullPage label="Loading job details…" />
  }

  if (!job) {
    return (
      <SectionCard>
        <EmptyState title="Job not found" description="This job may have been closed or removed." />
      </SectionCard>
    )
  }

  return (
    <>
      <PageHeader
        title={job.title}
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.candidateDashboard },
          { label: 'Search Jobs', to: ROUTES.candidateJobSearch },
          { label: job.title },
        ]}
        actions={
          <AppButton
            variant="contained"
            startIcon={<SendRoundedIcon />}
            loading={applyMutation.isPending}
            onClick={() => applyMutation.mutate()}
          >
            Apply Now
          </AppButton>
        }
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <SectionCard>
            <Stack spacing={2.5}>
              <Stack direction="row" flexWrap="wrap" gap={2}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <PlaceOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="body2">{job.location}</Typography>
                </Stack>
                {job.employmentType ? (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <WorkOutlineIcon fontSize="small" color="action" />
                    <Typography variant="body2">{job.employmentType}</Typography>
                  </Stack>
                ) : null}
                {job.status ? <StatusChip status={job.status} /> : null}
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Required Skills
                </Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                  {job.requiredSkills.map((skill) => (
                    <Chip key={skill} label={skill} size="small" color="primary" />
                  ))}
                </Stack>
              </Stack>

              {job.preferredSkills?.length ? (
                <Stack spacing={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Preferred Skills
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                    {job.preferredSkills.map((skill) => (
                      <Chip key={skill} label={skill} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Stack>
              ) : null}

              {(job.minExperience || job.maxExperience) && (
                <Stack spacing={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Experience
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {job.minExperience ?? 0}–{job.maxExperience ?? '∞'} years
                  </Typography>
                </Stack>
              )}
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="About this role">
            <Typography variant="body2" color="text.secondary">
              Review the requirements, then submit your application when you're ready — you'll be able to track
              its status from My Applications.
            </Typography>
          </SectionCard>
        </Grid>
      </Grid>
    </>
  )
}

export default function JobDetailsPage() {
  return <CandidateProfileGate>{(profile) => <JobDetailsBody profile={profile} />}</CandidateProfileGate>
}
