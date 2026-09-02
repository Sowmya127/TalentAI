import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Grid, IconButton, Stack, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
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
import { ROUTES } from '@/constants/routes'
import { educationSchema, type EducationFormValues } from './schemas'
import type { CandidateProfile, EducationEntry } from '@/types/candidate'

function EducationBody({ profile }: { profile: CandidateProfile }) {
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
        <Stack spacing={2}>
          {entries.map((entry) => (
            <SectionCard key={entry.educationId}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack spacing={0.25}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {entry.degree}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {entry.institution}
                    {entry.fieldOfStudy ? ` · ${entry.fieldOfStudy}` : ''}
                  </Typography>
                  {(entry.startYear || entry.endYear) && (
                    <Typography variant="caption" color="text.secondary">
                      {entry.startYear ?? '—'} – {entry.endYear ?? 'Present'}
                    </Typography>
                  )}
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={() => openEdit(entry)} aria-label="Edit education">
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setDeleting(entry)} aria-label="Remove education">
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
