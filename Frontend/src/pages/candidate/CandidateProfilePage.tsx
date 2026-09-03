import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Chip, Divider, Grid, Link as MuiLink, Stack, Typography } from '@mui/material'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppButton } from '@/components/common/AppButton'
import { AppAvatar } from '@/components/common/AppAvatar'
import { EmptyState } from '@/components/common/EmptyState'
import { CandidateProfileGate } from '@/components/candidate/CandidateProfileGate'
import { candidateApi } from '@/api/candidateApi'
import { ROUTES } from '@/constants/routes'
import type { CandidateProfile } from '@/types/candidate'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value}
      </Typography>
    </Stack>
  )
}

function ProfileBody({ profile }: { profile: CandidateProfile }) {
  const navigate = useNavigate()
  const [firstName, ...rest] = profile.name.split(' ')

  const { data: education } = useQuery({
    queryKey: ['candidateEducation', profile.candidateId],
    queryFn: () => candidateApi.getEducation(profile.candidateId),
  })
  const { data: experience } = useQuery({
    queryKey: ['candidateWorkExperience', profile.candidateId],
    queryFn: () => candidateApi.getWorkExperience(profile.candidateId),
  })
  const { data: certifications } = useQuery({
    queryKey: ['candidateCertifications', profile.candidateId],
    queryFn: () => candidateApi.getCertifications(profile.candidateId),
  })

  return (
    <>
      <PageHeader
        title="My Profile"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.candidateDashboard }, { label: 'My Profile' }]}
        actions={
          <AppButton
            variant="contained"
            startIcon={<EditRoundedIcon />}
            onClick={() => navigate(ROUTES.candidateProfileEdit)}
          >
            Edit Profile
          </AppButton>
        }
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard>
            <Stack spacing={2} alignItems="center" textAlign="center">
              <AppAvatar firstName={firstName} lastName={rest.join(' ')} size={72} />
              <Stack spacing={0.25}>
                <Typography variant="h6">{profile.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile.email}
                </Typography>
              </Stack>
              <Divider flexItem />
              <Stack spacing={1.25} sx={{ width: '100%' }}>
                <InfoRow label="Phone" value={profile.phone ?? '—'} />
                <InfoRow label="Location" value={profile.location ?? '—'} />
                <InfoRow
                  label="Experience"
                  value={profile.experience !== null ? `${profile.experience} yrs` : '—'}
                />
                <InfoRow label="Education" value={profile.education ?? '—'} />
              </Stack>
              <Divider flexItem />
              {profile.resumeUrl ? (
                <MuiLink
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}
                >
                  <DescriptionOutlinedIcon fontSize="small" />
                  View Resume
                </MuiLink>
              ) : (
                <AppButton size="small" onClick={() => navigate(ROUTES.candidateResume)}>
                  Upload your resume
                </AppButton>
              )}
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2.5}>
            <SectionCard
              title="Skills"
              actions={
                <AppButton size="small" onClick={() => navigate(ROUTES.candidateSkills)}>
                  Manage
                </AppButton>
              }
            >
              {profile.skills.length === 0 ? (
                <EmptyState title="No skills added yet" description="Add skills so recruiters can find you." />
              ) : (
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                  {profile.skills.map((skill) => (
                    <Chip key={skill} label={skill} size="small" />
                  ))}
                </Stack>
              )}
            </SectionCard>

            <SectionCard
              title="Work Experience"
              actions={
                <AppButton size="small" onClick={() => navigate(ROUTES.candidateExperience)}>
                  Manage
                </AppButton>
              }
            >
              {!experience || experience.length === 0 ? (
                <EmptyState title="No work experience added yet" />
              ) : (
                <Stack spacing={1.5} divider={<Divider />}>
                  {experience.slice(0, 3).map((exp) => (
                    <Stack key={exp.workExperienceId}>
                      <Typography variant="subtitle2">{exp.jobTitle}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {exp.companyName}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </SectionCard>

            <SectionCard
              title="Education"
              actions={
                <AppButton size="small" onClick={() => navigate(ROUTES.candidateEducation)}>
                  Manage
                </AppButton>
              }
            >
              {!education || education.length === 0 ? (
                <EmptyState title="No education added yet" />
              ) : (
                <Stack spacing={1.5} divider={<Divider />}>
                  {education.slice(0, 3).map((edu) => (
                    <Stack key={edu.educationId}>
                      <Typography variant="subtitle2">{edu.degree}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {edu.institution}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </SectionCard>

            <SectionCard
              title="Certifications"
              actions={
                <AppButton size="small" onClick={() => navigate(ROUTES.candidateCertifications)}>
                  Manage
                </AppButton>
              }
            >
              {!certifications || certifications.length === 0 ? (
                <EmptyState title="No certifications added yet" />
              ) : (
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                  {certifications.map((cert) => (
                    <Chip key={cert.certificationId} label={cert.name} size="small" variant="outlined" />
                  ))}
                </Stack>
              )}
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>
    </>
  )
}

export default function CandidateProfilePage() {
  return <CandidateProfileGate>{(profile) => <ProfileBody profile={profile} />}</CandidateProfileGate>
}
