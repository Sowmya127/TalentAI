import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Grid, Stack } from '@mui/material'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { FormTextField } from '@/components/form/FormTextField'
import { AppButton } from '@/components/common/AppButton'
import { CandidateProfileGate } from '@/components/candidate/CandidateProfileGate'
import { candidateApi } from '@/api/candidateApi'
import { candidateProfileQueryKey } from '@/hooks/useCandidateProfile'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import { editProfileSchema, type EditProfileFormValues } from './schemas'
import type { CandidateProfile } from '@/types/candidate'

function EditProfileBody({ profile }: { profile: CandidateProfile }) {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const { control, handleSubmit, reset } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      location: profile.location ?? '',
      noticePeriod: profile.noticePeriod ?? '',
      salaryExpectation: profile.salaryExpectation ? String(profile.salaryExpectation) : '',
    },
  })

  useEffect(() => {
    reset({
      location: profile.location ?? '',
      noticePeriod: profile.noticePeriod ?? '',
      salaryExpectation: profile.salaryExpectation ? String(profile.salaryExpectation) : '',
    })
  }, [profile, reset])

  const { mutate, isPending } = useMutation({
    mutationFn: (values: EditProfileFormValues) =>
      candidateApi.updateProfile(profile.candidateId, {
        location: values.location,
        noticePeriod: values.noticePeriod || undefined,
        salaryExpectation: values.salaryExpectation ? Number(values.salaryExpectation) : undefined,
      }),
    onSuccess: () => {
      toast.success('Profile updated successfully.')
      queryClient.invalidateQueries({ queryKey: candidateProfileQueryKey })
      navigate(ROUTES.candidateProfile)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update your profile.'),
  })

  return (
    <>
      <PageHeader
        title="Edit Profile"
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.candidateDashboard },
          { label: 'My Profile', to: ROUTES.candidateProfile },
          { label: 'Edit Profile' },
        ]}
      />
      <SectionCard>
        <Stack component="form" onSubmit={handleSubmit((values) => mutate(values))} spacing={2.5} sx={{ maxWidth: 560 }}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <FormTextField name="location" control={control} label="Location" autoComplete="address-level2" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                name="noticePeriod"
                control={control}
                label="Notice period"
                placeholder="e.g. 30 days"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                name="salaryExpectation"
                control={control}
                label="Salary expectation (annual, INR)"
                type="number"
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1.5}>
            <AppButton type="submit" variant="contained" loading={isPending}>
              Save changes
            </AppButton>
            <AppButton color="inherit" onClick={() => navigate(ROUTES.candidateProfile)}>
              Cancel
            </AppButton>
          </Stack>
        </Stack>
      </SectionCard>
    </>
  )
}

export default function CandidateProfileEditPage() {
  return <CandidateProfileGate>{(profile) => <EditProfileBody profile={profile} />}</CandidateProfileGate>
}
