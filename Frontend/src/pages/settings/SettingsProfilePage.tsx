import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Grid, Stack, Typography } from '@mui/material'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppAvatar } from '@/components/common/AppAvatar'
import { AppButton } from '@/components/common/AppButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { FormTextField } from '@/components/form/FormTextField'
import { userApi } from '@/api/userApi'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { roleLabel } from '@/constants/roles'
import { profileSchema, type ProfileFormValues } from './schemas'

export default function SettingsProfilePage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const userId = user?.userId ?? undefined

  const { data, isLoading, error } = useQuery({
    queryKey: ['selfUser', userId],
    queryFn: () => userApi.getUser(userId as number),
    enabled: Number.isFinite(userId),
  })

  const { control, handleSubmit, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', phoneNumber: '' },
  })

  useEffect(() => {
    if (data) reset({ firstName: data.firstName, lastName: data.lastName, phoneNumber: data.phoneNumber ?? '' })
  }, [data, reset])

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      userApi.updateUser(userId as number, {
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber || undefined,
      }),
    onSuccess: () => {
      toast.success('Profile updated.')
      queryClient.invalidateQueries({ queryKey: ['selfUser', userId] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update your profile.'),
  })

  if (isLoading) return <LoadingSpinner fullPage label="Loading your profile…" />
  if (error || !data) {
    return (
      <>
        <PageHeader title="Profile" breadcrumbs={[{ label: 'Settings' }, { label: 'Profile' }]} />
        <SectionCard>
          <EmptyState title="Couldn't load your profile" description="Please try again in a moment." />
        </SectionCard>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Profile" description="Manage your account details." breadcrumbs={[{ label: 'Settings' }, { label: 'Profile' }]} />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard>
            <Stack spacing={1.5} alignItems="center" textAlign="center">
              <AppAvatar firstName={data.firstName} lastName={data.lastName} size={72} />
              <Stack spacing={0.25}>
                <Typography variant="h6">
                  {data.firstName} {data.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {data.email}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.roles.map(roleLabel).join(', ')}
                </Typography>
              </Stack>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <SectionCard title="Account Details">
            <Stack component="form" onSubmit={handleSubmit((v) => mutate(v))} spacing={2.5} sx={{ maxWidth: 520 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormTextField name="firstName" control={control} label="First name" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormTextField name="lastName" control={control} label="Last name" />
                </Grid>
              </Grid>
              <FormTextField name="phoneNumber" control={control} label="Phone number" />
              <AppButton type="submit" variant="contained" loading={isPending} sx={{ alignSelf: 'flex-start' }}>
                Save Changes
              </AppButton>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </>
  )
}
