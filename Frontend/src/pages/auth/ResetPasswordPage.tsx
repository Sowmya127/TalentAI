import { useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link as MuiLink, Stack, Typography } from '@mui/material'
import { FormTextField } from '@/components/form/FormTextField'
import { AppButton } from '@/components/common/AppButton'
import { authApi } from '@/api/authApi'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import { resetPasswordSchema, type ResetPasswordFormValues } from './schemas'

export default function ResetPasswordPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [submitting, setSubmitting] = useState(false)

  const { control, handleSubmit } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      resetToken: searchParams.get('token') ?? '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setSubmitting(true)
    try {
      await authApi.resetPassword({ resetToken: values.resetToken, newPassword: values.newPassword })
      toast.success('Your password has been reset. Please sign in.')
      navigate(ROUTES.login, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reset your password. The link may have expired.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack spacing={3} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={700}>
          Reset your password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a new password for your account.
        </Typography>
      </Stack>

      <FormTextField
        name="resetToken"
        control={control}
        label="Reset token"
        helperText="From the link in your password reset email"
      />
      <FormTextField
        name="newPassword"
        control={control}
        label="New password"
        type="password"
        autoComplete="new-password"
        helperText="At least 8 characters"
      />
      <FormTextField
        name="confirmNewPassword"
        control={control}
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
      />

      <AppButton type="submit" variant="contained" size="large" fullWidth loading={submitting}>
        Reset password
      </AppButton>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        <MuiLink component={RouterLink} to={ROUTES.login} fontWeight={600}>
          Back to sign in
        </MuiLink>
      </Typography>
    </Stack>
  )
}
