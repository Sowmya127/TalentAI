import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Checkbox, FormControlLabel, IconButton, Stack, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
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
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'
import { workExperienceSchema, type WorkExperienceFormValues } from './schemas'
import type { CandidateProfile, WorkExperienceEntry } from '@/types/candidate'

function ExperienceBody({ profile }: { profile: CandidateProfile }) {
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
        <Stack spacing={2}>
          {entries.map((entry) => (
            <SectionCard key={entry.workExperienceId}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {entry.jobTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {entry.companyName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(entry.startDate)} – {entry.isCurrent ? 'Present' : formatDate(entry.endDate)}
                  </Typography>
                  {entry.description ? (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {entry.description}
                    </Typography>
                  ) : null}
                </Stack>
                <Stack direction="row" spacing={0.5} flexShrink={0}>
                  <IconButton size="small" onClick={() => openEdit(entry)} aria-label="Edit experience">
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setDeleting(entry)} aria-label="Remove experience">
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </SectionCard>
          ))}
        </Stack>
      )}

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
