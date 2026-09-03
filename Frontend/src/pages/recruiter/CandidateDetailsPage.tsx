import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Chip, Divider, Grid, Stack, Typography } from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import WorkHistoryOutlinedIcon from '@mui/icons-material/WorkHistoryOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppAvatar } from '@/components/common/AppAvatar'
import { AppButton } from '@/components/common/AppButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { ActivityTimeline, type ActivityEvent } from '@/components/common/ActivityTimeline'
import { candidateApi } from '@/api/candidateApi'
import { applicationApi } from '@/api/applicationApi'
import { initialsFromFullName } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'
import type { CandidateApplicationSummary } from '@/types/application'

/** Ordered recruitment pipeline for the activity timeline. Each stage lights up
 * once the application's status has reached (or passed) it. */
const PIPELINE = [
  'Applied',
  'Recruiter Viewed',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Sent',
] as const

/** How far each application status has progressed, as an index into PIPELINE.
 * Keys use the API status vocabulary (see the backend ApplicationStatusMapper):
 * "Interview Scheduled" → "Scheduled", "Interview Completed" → "Completed",
 * "Under Review" → "OnHold", "Offer Sent" → "OfferSent". */
const STATUS_STAGE: Record<string, number> = {
  Applied: 0,
  Screened: 1,
  OnHold: 1, // Under Review
  Shortlisted: 2,
  Scheduled: 3, // Interview Scheduled
  Completed: 4, // Interview Completed
  Selected: 4, // cleared interviews, awaiting an offer
  OfferSent: 5,
  Offer: 5,
  Hired: 5,
}

function buildTimeline(app?: CandidateApplicationSummary): ActivityEvent[] {
  const reached = app ? (STATUS_STAGE[app.status] ?? 0) : -1
  return PIPELINE.map((label, index) => {
    const done = index <= reached
    return {
      label,
      tone: done ? 'primary' : 'grey',
      done,
      timestamp: label === 'Applied' ? app?.appliedOn ?? null : null,
    }
  })
}

export default function CandidateDetailsPage() {
  const navigate = useNavigate()
  const { candidateId } = useParams<{ candidateId: string }>()
  const numericId = Number(candidateId)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['candidateProfileById', numericId],
    queryFn: () => candidateApi.getProfile(numericId),
    enabled: Number.isFinite(numericId),
  })
  const { data: applications } = useQuery({
    queryKey: ['candidateApplicationsById', numericId],
    queryFn: () => applicationApi.getMyApplications(numericId),
    enabled: Number.isFinite(numericId),
  })

  if (isLoading) return <LoadingSpinner fullPage label="Loading candidate…" />
  if (!profile) {
    return (
      <SectionCard>
        <EmptyState title="Candidate not found" description="This candidate profile could not be loaded." />
      </SectionCard>
    )
  }

  const latestApp = applications?.data?.[0]
  const timeline = buildTimeline(latestApp)

  return (
    <>
      <PageHeader
        title={profile.name}
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.recruiterDashboard },
          { label: 'Jobs', to: ROUTES.recruiterJobs },
          { label: 'Candidate' },
        ]}
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard>
            <Stack spacing={2} alignItems="center" textAlign="center">
              <AppAvatar firstName={initialsFromFullName(profile.name)} size={72} />
              <Stack spacing={0.25}>
                <Typography variant="h6">{profile.name}</Typography>
                {profile.experience != null ? (
                  <Typography variant="body2" color="text.secondary">
                    {profile.experience} years experience
                  </Typography>
                ) : null}
              </Stack>
              <Divider flexItem />
              <Stack spacing={1.25} sx={{ width: '100%' }}>
                <IconRow icon={<EmailOutlinedIcon fontSize="small" />} value={profile.email} />
                <IconRow icon={<PlaceOutlinedIcon fontSize="small" />} value={profile.location ?? '—'} />
                <IconRow icon={<WorkHistoryOutlinedIcon fontSize="small" />} value={profile.education ?? '—'} />
              </Stack>
              <Divider flexItem />
              <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
                <AppButton
                  variant="outlined"
                  fullWidth
                  onClick={() =>
                    latestApp && navigate(ROUTES.recruiterScheduleInterview.replace(':applicationId', String(latestApp.applicationId)))
                  }
                  disabled={!latestApp}
                >
                  Schedule Interview
                </AppButton>
              </Stack>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2.5}>
            <SectionCard title="Skills">
              {profile.skills.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No skills on file.
                </Typography>
              ) : (
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                  {profile.skills.map((skill) => (
                    <Chip key={skill} label={skill} size="small" />
                  ))}
                </Stack>
              )}
            </SectionCard>

            <SectionCard title="Recruitment Activity">
              <ActivityTimeline events={timeline} />
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>
    </>
  )
}

function IconRow({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ color: 'text.secondary' }}>
      {icon}
      <Typography variant="body2" color="text.primary" sx={{ wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Stack>
  )
}
