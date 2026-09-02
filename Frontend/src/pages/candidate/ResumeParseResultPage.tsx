import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Alert, Chip, Divider, Grid, Stack, Typography } from '@mui/material'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppButton } from '@/components/common/AppButton'
import { EmptyState } from '@/components/common/EmptyState'
import { CandidateProfileGate } from '@/components/candidate/CandidateProfileGate'
import { candidateApi } from '@/api/candidateApi'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import type { CandidateProfile, ResumeParseResponse } from '@/types/candidate'

function ChipList({ items, color }: { items: string[]; color?: 'default' | 'primary' | 'success' }) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        None found
      </Typography>
    )
  }
  return (
    <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
      {items.map((item) => (
        <Chip key={item} label={item} size="small" color={color} variant={color ? 'filled' : 'outlined'} />
      ))}
    </Stack>
  )
}

function ParseResultBody({ profile }: { profile: CandidateProfile }) {
  const navigate = useNavigate()
  const toast = useToast()
  const location = useLocation()
  const preloaded = location.state as ResumeParseResponse | null

  const parseMutation = useMutation({
    mutationFn: () => candidateApi.parseResume(profile.candidateId),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not parse your resume.'),
  })

  const result = parseMutation.data ?? preloaded

  return (
    <>
      <PageHeader
        title="Resume Parsing Result"
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.candidateDashboard },
          { label: 'Resume', to: ROUTES.candidateResume },
          { label: 'Parsing Result' },
        ]}
      />

      {!result ? (
        <SectionCard>
          <EmptyState
            icon={<AutoAwesomeRoundedIcon fontSize="medium" />}
            title="No parsing result yet"
            description="Run AI parsing on your uploaded resume to extract your skills, experience, and education automatically."
            action={
              <AppButton
                variant="contained"
                loading={parseMutation.isPending}
                onClick={() => parseMutation.mutate()}
              >
                Parse My Resume
              </AppButton>
            }
          />
        </SectionCard>
      ) : (
        <Stack spacing={2.5}>
          <Alert severity="info">
            This information was extracted automatically and is pending recruiter review before it's applied to
            your profile. Double-check it looks right — you can also update your Skills, Education, and Work
            Experience pages directly.
          </Alert>

          <SectionCard title="Extracted Information">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={0.5}>
                  <Typography variant="overline" color="text.secondary">
                    Experience
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {result.extracted.experience} years
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={0.5}>
                  <Typography variant="overline" color="text.secondary">
                    Education
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {result.extracted.education}
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={12}>
                <Divider />
              </Grid>
              <Grid size={12}>
                <Stack spacing={1}>
                  <Typography variant="overline" color="text.secondary">
                    Skills
                  </Typography>
                  <ChipList items={result.extracted.skills} color="primary" />
                </Stack>
              </Grid>
              <Grid size={12}>
                <Stack spacing={1}>
                  <Typography variant="overline" color="text.secondary">
                    Certifications
                  </Typography>
                  <ChipList items={result.extracted.certifications} color="success" />
                </Stack>
              </Grid>
              <Grid size={12}>
                <Stack spacing={1}>
                  <Typography variant="overline" color="text.secondary">
                    Companies
                  </Typography>
                  <ChipList items={result.extracted.companies} />
                </Stack>
              </Grid>
            </Grid>
          </SectionCard>

          <Stack direction="row" spacing={1.5}>
            <AppButton variant="outlined" onClick={() => navigate(ROUTES.candidateSkills)}>
              Update Skills
            </AppButton>
            <AppButton variant="outlined" onClick={() => navigate(ROUTES.candidateExperience)}>
              Update Experience
            </AppButton>
            <AppButton variant="outlined" onClick={() => navigate(ROUTES.candidateEducation)}>
              Update Education
            </AppButton>
          </Stack>
        </Stack>
      )}
    </>
  )
}

export default function ResumeParseResultPage() {
  return <CandidateProfileGate>{(profile) => <ParseResultBody profile={profile} />}</CandidateProfileGate>
}
