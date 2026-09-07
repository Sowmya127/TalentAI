import { useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link as MuiLink, Stack, Typography } from '@mui/material'
import { FormTextField } from '@/components/form/FormTextField'
import { AppButton } from '@/components/common/AppButton'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { toRoleKey } from '@/constants/roles'
import { getDefaultRouteForRoles } from '@/constants/navigation'
import { ROUTES } from '@/constants/routes'
import { loginSchema, type LoginFormValues } from './schemas'

export default function LoginPage() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true)
    try {
      const user = await login(values)
      const roleKeys = user.roles.map(toRoleKey).filter((k): k is NonNullable<typeof k> => k !== undefined)
      const from = (location.state as { from?: { pathname: string } } | null)?.from
      navigate(from?.pathname ?? getDefaultRouteForRoles(roleKeys), { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack spacing={3} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={700}>
          Welcome
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to continue to your TalentAI workspace.
        </Typography>
      </Stack>

      <FormTextField
        name="email"
        control={control}
        label="Email"
        type="email"
        autoComplete="email"
        autoFocus
      />
      <Stack spacing={0.5}>
        <FormTextField
          name="password"
          control={control}
          label="Password"
          type="password"
          autoComplete="current-password"
        />
        <MuiLink
          component={RouterLink}
          to={ROUTES.forgotPassword}
          variant="body2"
          sx={{ alignSelf: 'flex-end' }}
        >
          Forgot password?
        </MuiLink>
      </Stack>

      <AppButton type="submit" variant="contained" size="large" fullWidth loading={submitting}>
        Sign in
      </AppButton>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        Don&apos;t have an account?{' '}
        <MuiLink component={RouterLink} to={ROUTES.register} fontWeight={600}>
          Register as a candidate
        </MuiLink>
      </Typography>
    </Stack>
  )
}
