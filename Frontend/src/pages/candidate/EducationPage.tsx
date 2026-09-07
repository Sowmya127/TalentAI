import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Grid, IconButton, Stack, Typography, alpha } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppButton } from '@/components/common/AppButton'
import { AppDialog } from '@/components/common/AppDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { CardSkeleton } from '@/components/common/LoadingSkeleton'
import { FormTextField } from '@/components/form/FormTextField'
import { CandidateProfileGate } from '@/components/candidate/CandidateProfileGate'
import { candidateApi } from '@/api/candidateApi'
import { jobApi } from '@/api/jobApi'
import { useToast } from '@/hooks/useToast'
import { buildPath, ROUTES } from '@/constants/routes'
import { BRAND } from '@/theme/palette'
import { educationSchema, type EducationFormValues } from './schemas'
import type { CandidateProfile, EducationEntry } from '@/types/candidate'

/** The entry with the most recent end year (falls back to start year). */
function highestQualification(entries: EducationEntry[]): EducationEntry | null {
  if (entries.length === 0) return null
  return [...entries].sort((a, b) => (b.endYear ?? b.startYear ?? 0) - (a.endYear ?? a.startYear ?? 0))[0]
}

function EducationBody({ profile }: { profile: CandidateProfile }) {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const queryKey = ['candidateEducation', profile.candidateId]

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EducationEntry | null>(null)
  const [deleting, setDeleting] = useState<EducationEntry | null>(null)

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => candidateApi.getEducation(profile.candidateId),
  })
  const jobsQuery = useQuery({
    queryKey: ['publishedJobsForMatching'],
    queryFn: () => jobApi.search({ status: 'Published', page: 1, size: 50 }),
  })

  const { control, handleSubmit, reset } = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: { degree: '', institution: '', fieldOfStudy: '', startYear: '', endYear: '' },
  })

  const openAdd = () => {
    setEditing(null)
    reset({ degree: '', institution: '', fieldOfStudy: '', startYear: '', endYear: '' })
    setDialogOpen(true)
  }

  const openEdit = (entry: EducationEntry) => {
    setEditing(entry)
    reset({
      degree: entry.degree,
      institution: entry.institution,
      fieldOfStudy: entry.fieldOfStudy ?? '',
      startYear: entry.startYear ? String(entry.startYear) : '',
      endYear: entry.endYear ? String(entry.endYear) : '',
    })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (values: EducationFormValues) => {
      const payload = {
        degree: values.degree,
        institution: values.institution,
        fieldOfStudy: values.fieldOfStudy || undefined,
        startYear: values.startYear ? Number(values.startYear) : undefined,
        endYear: values.endYear ? Number(values.endYear) : undefined,
      }
      return editing
        ? candidateApi.updateEducation(profile.candidateId, editing.educationId, payload)
        : candidateApi.addEducation(profile.candidateId, payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Education updated.' : 'Education added.')
      queryClient.invalidateQueries({ queryKey })
      setDialogOpen(false)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save this entry.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (entry: EducationEntry) => candidateApi.removeEducation(profile.candidateId, entry.educationId),
    onSuccess: () => {
      toast.success('Education removed.')
      queryClient.invalidateQueries({ queryKey })
      setDeleting(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove this entry.'),
  })

  const entries = data ?? []
  const top = highestQualification(entries)

  // Open roles matching the candidate's experience level.
  const exp = profile.experience ?? 0
  const rolesForLevel = (jobsQuery.data?.data ?? []).filter((j) => {
    const min = j.minExperience
    const max = j.maxExperience
    return (min == null || exp >= min) && (max == null || exp <= max)
  })

  return (
    <>
      <PageHeader
        title="Education"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.candidateDashboard }, { label: 'Education' }]}
        actions={
          <AppButton variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            Add Education
          </AppButton>
        }
      />

      <Grid container spacing={2.5}>
        {/* Left — education entries */}
        <Grid size={{ xs: 12, md: 8 }}>
          {isLoading ? (
            <CardSkeleton height={160} />
          ) : entries.length === 0 ? (
            <SectionCard>
              <EmptyState
                icon={<SchoolOutlinedIcon fontSize="medium" />}
                title="No education added yet"
                description="Add your degrees and qualifications so recruiters can see your background."
                action={
                  <AppButton variant="contained" onClick={openAdd}>
                    Add Education
                  </AppButton>
                }
              />
            </SectionCard>
          ) : (
            <Grid container spacing={2}>
              {entries.map((entry) => (
                <Grid key={entry.educationId} size={12}>
                  <Box
                    sx={{
                      height: '100%',
                      bgcolor: 'background.paper',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      p: 2.5,
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2.5,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(BRAND.charcoal, 0.06),
                          color: BRAND.charcoal,
                        }}
                      >
                        <SchoolOutlinedIcon fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {entry.degree}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {entry.institution}
                          {entry.fieldOfStudy ? ` · ${entry.fieldOfStudy}` : ''}
                        </Typography>
                        {entry.startYear || entry.endYear ? (
                          <Typography variant="caption" color="text.secondary">
                            {entry.startYear ?? '—'} – {entry.endYear ?? 'Present'}
                          </Typography>
                        ) : null}
                      </Box>
                      <Stack direction="row" spacing={0.5} flexShrink={0}>
                        <IconButton size="small" onClick={() => openEdit(entry)} aria-label="Edit education">
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDeleting(entry)} aria-label="Remove education">
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* Right — insight rail */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2.5}>
            {top ? (
              <Box sx={{ bgcolor: BRAND.charcoal, color: '#FFFFFF', borderRadius: 3, p: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                  <SchoolOutlinedIcon sx={{ color: BRAND.taupe, fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ color: alpha('#FFFFFF', 0.9) }}>
                    Highest qualification
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight={700}>
                  {top.degree}
                </Typography>
                <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.75) }}>
                  {top.institution}
                  {top.fieldOfStudy ? ` · ${top.fieldOfStudy}` : ''}
                </Typography>
                {top.startYear || top.endYear ? (
                  <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.6) }}>
                    {top.startYear ?? '—'} – {top.endYear ?? 'Present'}
                  </Typography>
                ) : null}
              </Box>
            ) : null}

            <SectionCard>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <WorkOutlineIcon fontSize="small" sx={{ color: BRAND.slate }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Roles for your background
                </Typography>
              </Stack>
              {jobsQuery.isLoading ? (
                <CardSkeleton height={100} />
              ) : rolesForLevel.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No open roles match your experience level right now — check back soon.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    {rolesForLevel.length} open {rolesForLevel.length === 1 ? 'role matches' : 'roles match'} your{' '}
                    {exp > 0 ? `${exp}-yr` : 'experience'} level.
                  </Typography>
                  <Stack spacing={1}>
                    {rolesForLevel.slice(0, 3).map((job) => (
                      <Box
                        key={job.jobId}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(buildPath(ROUTES.candidateJobDetails, { jobId: job.jobId }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            navigate(buildPath(ROUTES.candidateJobDetails, { jobId: job.jobId }))
                          }
                        }}
                        sx={{
                          cursor: 'pointer',
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          px: 1.5,
                          py: 1.25,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          '&:hover': { borderColor: BRAND.taupe, bgcolor: alpha(BRAND.taupe, 0.06) },
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {job.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {[job.department, job.location].filter(Boolean).join(' · ') || 'Open role'}
                          </Typography>
                        </Box>
                        <ChevronRightRoundedIcon fontSize="small" sx={{ color: BRAND.slate, flexShrink: 0 }} />
                      </Box>
                    ))}
                  </Stack>
                  <AppButton variant="outlined" fullWidth onClick={() => navigate(ROUTES.candidateJobSearch)}>
                    Browse all roles
                  </AppButton>
                </Stack>
              )}
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>

      {dialogOpen ? (
        <AppDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={editing ? 'Edit Education' : 'Add Education'}
          actions={
            <>
              <AppButton color="inherit" onClick={() => setDialogOpen(false)}>
                Cancel
              </AppButton>
              <AppButton
                variant="contained"
                loading={saveMutation.isPending}
                onClick={handleSubmit((values) => saveMutation.mutate(values))}
              >
                Save
              </AppButton>
            </>
          }
        >
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <FormTextField name="degree" control={control} label="Degree" autoFocus />
            <FormTextField name="institution" control={control} label="Institution" />
            <FormTextField name="fieldOfStudy" control={control} label="Field of study (optional)" />
            <Grid container spacing={2}>
              <Grid size={6}>
                <FormTextField name="startYear" control={control} label="Start year" type="number" />
              </Grid>
              <Grid size={6}>
                <FormTextField name="endYear" control={control} label="End year" type="number" />
              </Grid>
            </Grid>
          </Stack>
        </AppDialog>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove education"
        message={`Remove "${deleting?.degree}" from your profile? This can't be undone.`}
        confirmLabel="Remove"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}

export default function EducationPage() {
  return <CandidateProfileGate>{(profile) => <EducationBody profile={profile} />}</CandidateProfileGate>
}
