import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconButton, Stack, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'
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
import { certificationSchema, type CertificationFormValues } from './schemas'
import type { CandidateProfile, Certification } from '@/types/candidate'

function CertificationsBody({ profile }: { profile: CandidateProfile }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const queryKey = ['candidateCertifications', profile.candidateId]

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<Certification | null>(null)

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => candidateApi.getCertifications(profile.candidateId),
  })

  const { control, handleSubmit, reset } = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationSchema),
    defaultValues: { name: '', issuer: '', issueDate: '' },
  })

  const openAdd = () => {
    reset({ name: '', issuer: '', issueDate: '' })
    setDialogOpen(true)
  }

  const addMutation = useMutation({
    mutationFn: (values: CertificationFormValues) => candidateApi.addCertification(profile.candidateId, values),
    onSuccess: () => {
      toast.success('Certification added.')
      queryClient.invalidateQueries({ queryKey })
      setDialogOpen(false)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not add this certification.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (cert: Certification) => candidateApi.removeCertification(profile.candidateId, cert.certificationId),
    onSuccess: () => {
      toast.success('Certification removed.')
      queryClient.invalidateQueries({ queryKey })
      setDeleting(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove this certification.'),
  })

  const certifications = data ?? []

  return (
    <>
      <PageHeader
        title="Certifications"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.candidateDashboard }, { label: 'Certifications' }]}
        actions={
          <AppButton variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            Add Certification
          </AppButton>
        }
      />

      {isLoading ? (
        <CardSkeleton height={140} />
      ) : certifications.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<WorkspacePremiumOutlinedIcon fontSize="medium" />}
            title="No certifications added yet"
            description="Add any professional certifications relevant to the roles you're applying for."
            action={
              <AppButton variant="contained" onClick={openAdd}>
                Add Certification
              </AppButton>
            }
          />
        </SectionCard>
      ) : (
        <Stack spacing={2}>
          {certifications.map((cert) => (
            <SectionCard key={cert.certificationId}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack spacing={0.25}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {cert.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cert.issuer}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Issued {formatDate(cert.issueDate)}
                  </Typography>
                </Stack>
                <IconButton size="small" onClick={() => setDeleting(cert)} aria-label="Remove certification">
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </SectionCard>
          ))}
        </Stack>
      )}

      {dialogOpen ? (
        <AppDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Add Certification"
          actions={
            <>
              <AppButton color="inherit" onClick={() => setDialogOpen(false)}>
                Cancel
              </AppButton>
              <AppButton
                variant="contained"
                loading={addMutation.isPending}
                onClick={handleSubmit((values) => addMutation.mutate(values))}
              >
                Save
              </AppButton>
            </>
          }
        >
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <FormTextField name="name" control={control} label="Certification name" autoFocus />
            <FormTextField name="issuer" control={control} label="Issuer" />
            <FormTextField
              name="issueDate"
              control={control}
              label="Issue date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </AppDialog>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove certification"
        message={`Remove "${deleting?.name}" from your profile? This can't be undone.`}
        confirmLabel="Remove"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}

export default function CertificationsPage() {
  return <CandidateProfileGate>{(profile) => <CertificationsBody profile={profile} />}</CandidateProfileGate>
}
