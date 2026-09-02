import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Chip, Divider, Grid, Stack, Typography } from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import WorkHistoryOutlinedIcon from '@mui/icons-material/WorkHistoryOutlined'
import type { ReactNode } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppAvatar } from '@/components/common/AppAvatar'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { AiInsightCard } from '@/components/common/AiInsightCard'
import { candidateApi } from '@/api/candidateApi'
import { initialsFromFullName } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'

export default function InterviewerCandidateDetailsPage() {
  const { candidateId } = useParams<{ candidateId: string }>()
  const numericId = Number(candidateId)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['candidateProfileById', numericId],
    queryFn: () => candidateApi.getProfile(numericId),
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

  return (
    <>
      <PageHeader
        title={profile.name}
        description="Candidate context for your interview"
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.interviewerDashboard },
          { label: 'Upcoming Interviews', to: ROUTES.interviewerUpcoming },
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
                <IconRow icon={<SchoolOutlinedIcon fontSize="small" />} value={profile.education ?? '—'} />
                <IconRow icon={<WorkHistoryOutlinedIcon fontSize="small" />} value={`${profile.skills.length} skills on file`} />
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

            <AiInsightCard title="Suggested Focus Areas">
              <Typography variant="body2" color="text.primary">
                Probe depth on the candidate's core skills and ask for concrete examples from their most recent role.
                AI-generated, role-specific interview prompts will appear here once the assistant is enabled.
              </Typography>
            </AiInsightCard>
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
