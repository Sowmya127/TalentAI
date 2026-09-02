import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Stack } from '@mui/material'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { FormTextField } from '@/components/form/FormTextField'
import { AppButton } from '@/components/common/AppButton'
import { userApi } from '@/api/userApi'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { changePasswordSchema, type ChangePasswordFormValues } from './schemas'

export default function ChangePasswordPage() {
  const { user } = useAuth()
  const toast = useToast()

  const { control, handleSubmit, reset } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ChangePasswordFormValues) => {
      if (!user?.userId) throw new Error('Your session is missing a user id. Please sign in again.')
      return userApi.changePassword(user.userId, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
    },
    onSuccess: () => {
      toast.success('Password changed.')
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not change your password.'),
  })

  return (
    <>
      <PageHeader title="Change Password" breadcrumbs={[{ label: 'Settings' }, { label: 'Change Password' }]} />

      <SectionCard title="Update Password">
        <Stack component="form" onSubmit={handleSubmit((v) => mutate(v))} spacing={2.5} sx={{ maxWidth: 440 }}>
          <FormTextField name="currentPassword" control={control} label="Current password" type="password" autoComplete="current-password" />
          <FormTextField
            name="newPassword"
            control={control}
            label="New password"
            type="password"
            autoComplete="new-password"
            helperText="At least 8 characters"
          />
          <FormTextField name="confirmPassword" control={control} label="Confirm new password" type="password" autoComplete="new-password" />
          <AppButton type="submit" variant="contained" loading={isPending} sx={{ alignSelf: 'flex-start' }}>
            Change Password
          </AppButton>
        </Stack>
      </SectionCard>
    </>
  )
}
