import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Checkbox, Chip, FormControlLabel, Grid, IconButton, Stack, Typography, alpha } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
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
import { formatDate } from '@/utils/formatters'
import { buildPath, ROUTES } from '@/constants/routes'
import { BRAND } from '@/theme/palette'
import { workExperienceSchema, type WorkExperienceFormValues } from './schemas'
import type { CandidateProfile, WorkExperienceEntry } from '@/types/candidate'

/** Whole months between two dates (current roles run to today). */
function monthsBetween(start?: string, end?: string | null, isCurrent?: boolean): number {
  if (!start) return 0
  const s = new Date(start)
  const e = isCurrent || !end ? new Date() : new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0
  const m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  return m < 0 ? 0 : m
}

/** Human duration label, e.g. "2 yrs 3 mos". */
function labelFromMonths(months: number): string {
  const yrs = Math.floor(months / 12)
  const mos = months % 12
  const parts: string[] = []
  if (yrs) parts.push(`${yrs} yr${yrs > 1 ? 's' : ''}`)
  if (mos) parts.push(`${mos} mo${mos > 1 ? 's' : ''}`)
  return parts.join(' ') || '<1 mo'
}

function ExperienceBody({ profile }: { profile: CandidateProfile }) {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const queryKey = ['candidateWorkExperience', profile.candidateId]

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorkExperienceEntry | null>(null)
  const [deleting, setDeleting] = useState<WorkExperienceEntry | null>(null)

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => candidateApi.getWorkExperience(profile.candidateId),
  })
  const skillsQuery = useQuery({
    queryKey: ['candidateSkills', profile.candidateId],
    queryFn: () => candidateApi.getSkills(profile.candidateId),
  })
  const jobsQuery = useQuery({
    queryKey: ['publishedJobsForMatching'],
    queryFn: () => jobApi.search({ status: 'Published', page: 1, size: 50 }),
  })

  const { control, handleSubmit, reset, watch } = useForm<WorkExperienceFormValues>({
    resolver: zodResolver(workExperienceSchema),
    defaultValues: {
      jobTitle: '',
      companyName: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
    },
  })
  const isCurrent = watch('isCurrent')

  const openAdd = () => {
    setEditing(null)
    reset({ jobTitle: '', companyName: '', startDate: '', endDate: '', isCurrent: false, description: '' })
    setDialogOpen(true)
  }

  const openEdit = (entry: WorkExperienceEntry) => {
    setEditing(entry)
    reset({
      jobTitle: entry.jobTitle,
      companyName: entry.companyName,
      startDate: entry.startDate?.slice(0, 10) ?? '',
      endDate: entry.endDate?.slice(0, 10) ?? '',
      isCurrent: Boolean(entry.isCurrent),
      description: entry.description ?? '',
    })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (values: WorkExperienceFormValues) => {
      const payload = {
        jobTitle: values.jobTitle,
        companyName: values.companyName,
        startDate: values.startDate,
        endDate: values.isCurrent ? undefined : values.endDate || undefined,
        isCurrent: values.isCurrent,
        description: values.description || undefined,
      }
      return editing
        ? candidateApi.updateWorkExperience(profile.candidateId, editing.workExperienceId, payload)
        : candidateApi.addWorkExperience(profile.candidateId, payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Work experience updated.' : 'Work experience added.')
      queryClient.invalidateQueries({ queryKey })
      setDialogOpen(false)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save this entry.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (entry: WorkExperienceEntry) =>
      candidateApi.removeWorkExperience(profile.candidateId, entry.workExperienceId),
    onSuccess: () => {
      toast.success('Work experience removed.')
      queryClient.invalidateQueries({ queryKey })
      setDeleting(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove this entry.'),
  })

  const entries = data ?? []

  // --- Experience summary ---
  const totalMonths = entries.reduce((sum, e) => sum + monthsBetween(e.startDate, e.endDate, e.isCurrent), 0)
  const currentEntry =
    entries.find((e) => e.isCurrent) ??
    [...entries].sort((a, b) => new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime())[0]

  // --- Roles hiring for you: rank open jobs by skill overlap, fall back to title match ---
  const jobs = jobsQuery.data?.data ?? []
  const skillSet = new Set((skillsQuery.data?.skills ?? []).map((s) => s.toLowerCase()))
  let matched = jobs
    .map((job) => ({
      job,
      score: [...(job.requiredSkills ?? []), ...(job.preferredSkills ?? [])].filter((s) =>
        skillSet.has(s.trim().toLowerCase()),
      ).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.job)

  if (matched.length === 0 && currentEntry?.jobTitle) {
    const words = currentEntry.jobTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    matched = jobs.filter((job) => words.some((w) => job.title.toLowerCase().includes(w)))
  }
  matched = matched.slice(0, 3)

  return (
    <>
      <PageHeader
        title="Work Experience"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.candidateDashboard }, { label: 'Work Experience' }]}
        actions={
          <AppButton variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            Add Experience
          </AppButton>
        }
      />

      <Grid container spacing={2.5}>
        {/* Left — career timeline */}
        <Grid size={{ xs: 12, md: 8 }}>
          {isLoading ? (
            <CardSkeleton height={160} />
          ) : entries.length === 0 ? (
            <SectionCard>
              <EmptyState
                icon={<WorkOutlineIcon fontSize="medium" />}
                title="No work experience added yet"
                description="Add your past roles so recruiters can see your professional background."
                action={
                  <AppButton variant="contained" onClick={openAdd}>
                    Add Experience
                  </AppButton>
                }
              />
            </SectionCard>
          ) : (
            <SectionCard title="Career timeline">
              <Stack>
                {entries.map((entry, i) => {
                  const last = i === entries.length - 1
                  const duration = labelFromMonths(monthsBetween(entry.startDate, entry.endDate, entry.isCurrent))
                  return (
                    <Stack key={entry.workExperienceId} direction="row" spacing={2} alignItems="stretch">
                      {/* timeline rail */}
                      <Stack alignItems="center" sx={{ width: 16, flexShrink: 0 }}>
                        <Box
                          sx={{
                            mt: 0.75,
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            flexShrink: 0,
                            bgcolor: entry.isCurrent ? BRAND.taupe : BRAND.charcoal,
                            border: '3px solid',
                            borderColor: entry.isCurrent ? alpha(BRAND.taupe, 0.25) : alpha(BRAND.charcoal, 0.12),
                          }}
                        />
                        {!last ? <Box sx={{ flexGrow: 1, width: 2, bgcolor: 'divider', my: 0.5 }} /> : null}
                      </Stack>
                      {/* role card */}
                      <Box
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          mb: last ? 0 : 2.5,
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          p: 2,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                              <Typography variant="subtitle1" fontWeight={700}>
                                {entry.jobTitle}
                              </Typography>
                              {entry.isCurrent ? (
                                <Chip
                                  label="Current"
                                  size="small"
                                  sx={{ height: 20, bgcolor: alpha(BRAND.taupe, 0.18), color: BRAND.steelDark, fontWeight: 600 }}
                                />
                              ) : null}
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {entry.companyName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(entry.startDate)} – {entry.isCurrent ? 'Present' : formatDate(entry.endDate)}
                              {duration ? ` · ${duration}` : ''}
                            </Typography>
                            {entry.description ? (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {entry.description}
                              </Typography>
                            ) : null}
                          </Box>
                          <Stack direction="row" spacing={0.5} flexShrink={0}>
                            <IconButton size="small" onClick={() => openEdit(entry)} aria-label="Edit experience">
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => setDeleting(entry)} aria-label="Remove experience">
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Box>
                    </Stack>
                  )
                })}
              </Stack>
            </SectionCard>
          )}
        </Grid>

        {/* Right — insight rail */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2.5}>
            {entries.length > 0 ? (
              <SectionCard>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                  Experience summary
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {totalMonths > 0 ? labelFromMonths(totalMonths) : '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total experience
                </Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Roles
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {entries.length}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      Current
                    </Typography>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ textAlign: 'right', minWidth: 0 }}>
                      {entries.some((e) => e.isCurrent) ? currentEntry?.companyName ?? '—' : 'None'}
                    </Typography>
                  </Stack>
                </Stack>
              </SectionCard>
            ) : null}

            <SectionCard>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <WorkOutlineIcon fontSize="small" sx={{ color: BRAND.slate }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Roles hiring for you
                </Typography>
              </Stack>
              {jobsQuery.isLoading ? (
                <CardSkeleton height={100} />
              ) : matched.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No close matches to your background right now — browse all open roles below.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {matched.map((job) => (
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
              )}
              <AppButton variant="outlined" fullWidth sx={{ mt: 1.5 }} onClick={() => navigate(ROUTES.candidateJobSearch)}>
                Browse all roles
              </AppButton>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>

      {dialogOpen ? (
        <AppDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={editing ? 'Edit Work Experience' : 'Add Work Experience'}
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
            <FormTextField name="jobTitle" control={control} label="Job title" autoFocus />
            <FormTextField name="companyName" control={control} label="Company name" />
            <FormTextField
              name="startDate"
              control={control}
              label="Start date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            {!isCurrent ? (
              <FormTextField
                name="endDate"
                control={control}
                label="End date"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            ) : null}
            <Controller
              name="isCurrent"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label="I currently work here"
                />
              )}
            />
            <FormTextField name="description" control={control} label="Description (optional)" multiline minRows={2} />
          </Stack>
        </AppDialog>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove work experience"
        message={`Remove "${deleting?.jobTitle}" at ${deleting?.companyName}? This can't be undone.`}
        confirmLabel="Remove"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}

export default function WorkExperiencePage() {
  return <CandidateProfileGate>{(profile) => <ExperienceBody profile={profile} />}</CandidateProfileGate>
}
