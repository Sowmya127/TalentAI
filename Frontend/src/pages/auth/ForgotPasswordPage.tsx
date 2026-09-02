import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Link as MuiLink, Stack, Typography } from '@mui/material'
import { FormTextField } from '@/components/form/FormTextField'
import { AppButton } from '@/components/common/AppButton'
import { authApi } from '@/api/authApi'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from './schemas'

export default function ForgotPasswordPage() {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const { control, handleSubmit } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setSubmitting(true)
    try {
      await authApi.forgotPassword(values)
      setSent(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send the reset link. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <Stack spacing={2.5}>
        <Alert severity="success">
          If an account exists for that email, a password reset link has been sent.
        </Alert>
        <MuiLink component={RouterLink} to={ROUTES.login} variant="body2" fontWeight={600}>
          Back to sign in
        </MuiLink>
      </Stack>
    )
  }

  return (
    <Stack spacing={3} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={700}>
          Forgot your password?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your account email and we&apos;ll send you a link to reset it.
        </Typography>
      </Stack>

      <FormTextField name="email" control={control} label="Email" type="email" autoComplete="email" autoFocus />

      <AppButton type="submit" variant="contained" size="large" fullWidth loading={submitting}>
        Send reset link
      </AppButton>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        <MuiLink component={RouterLink} to={ROUTES.login} fontWeight={600}>
          Back to sign in
        </MuiLink>
      </Typography>
    </Stack>
  )
}
