import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Link as MuiLink,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material'
import { FormTextField } from '@/components/form/FormTextField'
import { AppButton } from '@/components/common/AppButton'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { registrationApi } from '@/api/registrationApi'
import { ROUTES } from '@/constants/routes'
import { registerSchema, type RegisterFormValues } from './schemas'

const FALLBACK_ROLES = [
  { role: 'Candidate' },
  { role: 'Recruiter' },
  { role: 'Hiring Manager' },
  { role: 'Interviewer' },
  { role: 'HR Admin' },
]

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  // Roles offered for self-registration (System Admin is never returned by the API).
  const { data: roles } = useQuery({
    queryKey: ['selfRegisterableRoles'],
    queryFn: registrationApi.getSelfRegisterableRoles,
  })
  const roleOptions = roles && roles.length > 0 ? roles : FALLBACK_ROLES

  const { control, handleSubmit, watch } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      requestedRole: 'Candidate',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      companyName: '',
      organizationEmail: '',
      password: '',
      confirmPassword: '',
    },
  })
  const requestedRole = watch('requestedRole')
  const isCandidate = requestedRole === 'Candidate'

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitting(true)
    try {
      const result = await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber || undefined,
        requestedRole: values.requestedRole,
        companyName: isCandidate ? undefined : values.companyName || undefined,
        organizationEmail: isCandidate ? undefined : values.organizationEmail || undefined,
      })
      // ACTIVE (candidate) → sign in now; PENDING_APPROVAL → the message says to wait.
      if (result.status === 'PENDING_APPROVAL') {
        toast.info(result.message)
      } else {
        toast.success('Registration successful. Please sign in.')
      }
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
          Create your account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Candidates are activated instantly. Recruiter, Hiring Manager, Interviewer and HR accounts are
          reviewed by an administrator before activation. (System Administrator accounts are provisioned
          internally.)
        </Typography>
      </Stack>

      <Controller
        name="requestedRole"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl error={Boolean(fieldState.error)}>
            <FormLabel sx={{ mb: 0.5, fontWeight: 600 }}>Register as</FormLabel>
            <RadioGroup {...field}>
              {roleOptions.map((r) => (
                <FormControlLabel key={r.role} value={r.role} control={<Radio size="small" />} label={r.role} />
              ))}
            </RadioGroup>
          </FormControl>
        )}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField name="firstName" control={control} label="First name" autoComplete="given-name" autoFocus />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField name="lastName" control={control} label="Last name" autoComplete="family-name" />
        </Grid>
      </Grid>

      <FormTextField name="email" control={control} label="Email" type="email" autoComplete="email" />
      <FormTextField name="phoneNumber" control={control} label="Phone number (optional)" autoComplete="tel" />

      {!isCandidate ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField name="companyName" control={control} label="Company (optional)" autoComplete="organization" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField
              name="organizationEmail"
              control={control}
              label="Work email (optional)"
              type="email"
              autoComplete="email"
            />
          </Grid>
        </Grid>
      ) : null}

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
