import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Stack, Typography } from '@mui/material'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import { SectionCard } from '@/components/common/SectionCard'
import { FormTextField } from '@/components/form/FormTextField'
import { AppButton } from '@/components/common/AppButton'
import { candidateApi } from '@/api/candidateApi'
import { candidateProfileQueryKey } from '@/hooks/useCandidateProfile'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { createProfileSchema, type CreateProfileFormValues } from '@/pages/candidate/schemas'

/** Shown when GET /candidates/me 404s — a normal state for a candidate who
 * just registered (US-015: profile creation is a separate step from
 * account registration). */
export function CreateProfilePrompt() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()

  const { control, handleSubmit } = useForm<CreateProfileFormValues>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: { phone: '', location: '' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (values: CreateProfileFormValues) => {
      if (!user?.userId) throw new Error('Your session is missing a user id. Please sign in again.')
      return candidateApi.createProfile({ userId: user.userId, phone: values.phone, location: values.location })
    },
    onSuccess: () => {
      toast.success('Your candidate profile has been created.')
      queryClient.invalidateQueries({ queryKey: candidateProfileQueryKey })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create your profile.'),
  })

  return (
    <SectionCard>
      <Stack spacing={3} sx={{ maxWidth: 440, mx: 'auto', py: 2 }} alignItems="center" textAlign="center">
        <PersonAddAltRoundedIcon color="primary" sx={{ fontSize: 40 }} />
        <Stack spacing={0.5}>
          <Typography variant="h6">Set up your candidate profile</Typography>
          <Typography variant="body2" color="text.secondary">
            Add your phone number and location to start applying for jobs on TalentAI.
          </Typography>
        </Stack>
        <Stack
          component="form"
          onSubmit={handleSubmit((values) => mutate(values))}
          spacing={2}
          sx={{ width: '100%' }}
        >
          <FormTextField name="phone" control={control} label="Phone number" autoComplete="tel" />
          <FormTextField name="location" control={control} label="Location" autoComplete="address-level2" />
          <AppButton type="submit" variant="contained" loading={isPending}>
            Create profile
          </AppButton>
        </Stack>
      </Stack>
    </SectionCard>
  )
}
