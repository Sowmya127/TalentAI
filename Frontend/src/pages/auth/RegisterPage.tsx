import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Grid, Link as MuiLink, Stack, Typography } from '@mui/material'
import { FormTextField } from '@/components/form/FormTextField'
import { AppButton } from '@/components/common/AppButton'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import { registerSchema, type RegisterFormValues } from './schemas'

export default function RegisterPage() {
  const { register: registerCandidate } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitting(true)
    try {
      await registerCandidate({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber || undefined,
      })
      toast.success('Registration successful. Please sign in.')
      navigate(ROUTES.login, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack spacing={3} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={700}>
          Create your candidate account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Internal roles (Recruiter, Hiring Manager, etc.) are provisioned by an administrator.
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField name="firstName" control={control} label="First name" autoComplete="given-name" autoFocus />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField name="lastName" control={control} label="Last name" autoComplete="family-name" />
        </Grid>
      </Grid>

      <FormTextField name="email" control={control} label="Email" type="email" autoComplete="email" />
      <FormTextField
        name="phoneNumber"
        control={control}
        label="Phone number (optional)"
        autoComplete="tel"
      />
      <FormTextField
        name="password"
        control={control}
        label="Password"
        type="password"
        autoComplete="new-password"
        helperText="At least 8 characters"
      />
      <FormTextField
        name="confirmPassword"
        control={control}
        label="Confirm password"
        type="password"
        autoComplete="new-password"
      />

      <AppButton type="submit" variant="contained" size="large" fullWidth loading={submitting}>
        Create account
      </AppButton>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        Already have an account?{' '}
        <MuiLink component={RouterLink} to={ROUTES.login} fontWeight={600}>
          Sign in
        </MuiLink>
      </Typography>
    </Stack>
  )
}
