import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Grid, Stack } from '@mui/material'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { FormTextField } from '@/components/form/FormTextField'
import { FormSelect } from '@/components/form/FormSelect'
import { AppButton } from '@/components/common/AppButton'
import { offerApi } from '@/api/offerApi'
import { useToast } from '@/hooks/useToast'
import { buildPath, ROUTES } from '@/constants/routes'
import { generateOfferSchema, type GenerateOfferFormValues } from './schemas'

const CURRENCIES = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
]

export default function GenerateOfferPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const location = useLocation()
  const prefilledApplicationId = (location.state as { applicationId?: number } | null)?.applicationId

  const { control, handleSubmit } = useForm<GenerateOfferFormValues>({
    resolver: zodResolver(generateOfferSchema),
    defaultValues: {
      applicationId: prefilledApplicationId ? String(prefilledApplicationId) : '',
      baseSalary: '',
      currency: 'INR',
      variablePay: '',
      joiningDate: '',
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (values: GenerateOfferFormValues) =>
      offerApi.generate({
        applicationId: Number(values.applicationId),
        compensation: {
          baseSalary: Number(values.baseSalary),
          currency: values.currency,
          variablePay: values.variablePay ? Number(values.variablePay) : undefined,
        },
        joiningDate: values.joiningDate,
      }),
    onSuccess: (res) => {
      toast.success('Offer created as a draft.')
      navigate(buildPath(ROUTES.offerDetails, { offerId: res.offerId }))
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not generate the offer.'),
  })

  return (
    <>
      <PageHeader
        title="Generate Offer"
        description="Create an offer for a selected candidate."
        breadcrumbs={[{ label: 'Offers' }, { label: 'Generate Offer' }]}
      />

      <SectionCard title="Offer Details">
        <Stack component="form" onSubmit={handleSubmit((v) => mutate(v))} spacing={2.5} sx={{ maxWidth: 620 }}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <FormTextField
                name="applicationId"
                control={control}
                label="Application ID"
                type="number"
                helperText="The selected candidate's application"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField name="baseSalary" control={control} label="Base salary (annual)" type="number" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormSelect name="currency" control={control} label="Currency" options={CURRENCIES} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField name="variablePay" control={control} label="Variable pay (optional)" type="number" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                name="joiningDate"
                control={control}
                label="Joining date"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={1.5}>
            <AppButton type="submit" variant="contained" loading={isPending}>
              Generate Offer
            </AppButton>
            <AppButton color="inherit" onClick={() => navigate(-1)}>
              Cancel
            </AppButton>
          </Stack>
        </Stack>
      </SectionCard>
    </>
  )
}
