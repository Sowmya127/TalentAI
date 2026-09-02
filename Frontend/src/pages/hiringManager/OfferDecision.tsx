import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Divider, Grid, Stack, TextField, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { StatusChip } from '@/components/common/StatusChip'
import { AppButton } from '@/components/common/AppButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { offerApi } from '@/api/offerApi'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'

interface OfferDecisionProps {
  mode: 'approve' | 'reject'
}

export function OfferDecision({ mode }: OfferDecisionProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const { offerId } = useParams<{ offerId: string }>()
  const numericId = Number(offerId)
  const [comments, setComments] = useState('')

  const isApprove = mode === 'approve'

  const { data: offer, isLoading } = useQuery({
    queryKey: ['offer', numericId],
    queryFn: () => offerApi.getOffer(numericId),
    enabled: Number.isFinite(numericId),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      offerApi.approve(numericId, {
        decision: isApprove ? 'Approved' : 'Rejected',
        comments: comments || undefined,
      }),
    onSuccess: () => {
      toast.success(isApprove ? 'Offer approved.' : 'Offer rejected.')
      navigate(ROUTES.hiringManagerDashboard)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not record the decision.'),
  })

  if (isLoading) return <LoadingSpinner fullPage label="Loading offer…" />
  if (!offer) {
    return (
      <SectionCard>
        <EmptyState title="Offer not found" description="This offer could not be loaded." />
      </SectionCard>
    )
  }

  return (
    <>
      <PageHeader
        title={isApprove ? 'Approve Offer' : 'Reject Offer'}
        description={offer.candidateName ?? `Offer #${offer.offerId}`}
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.hiringManagerDashboard },
          { label: isApprove ? 'Approve Offer' : 'Reject Offer' },
        ]}
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <SectionCard title="Offer Details">
            <Stack spacing={2}>
              <Row label="Status" value={<StatusChip status={offer.status} />} />
              <Divider />
              {offer.jobTitle ? <Row label="Role" value={offer.jobTitle} /> : null}
              <Row label="Base Salary" value={formatCurrency(offer.compensation.baseSalary, offer.compensation.currency)} />
              {offer.compensation.variablePay != null ? (
                <Row label="Variable Pay" value={formatCurrency(offer.compensation.variablePay, offer.compensation.currency)} />
              ) : null}
              <Row label="Joining Date" value={formatDate(offer.joiningDate)} />
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title={isApprove ? 'Approval' : 'Rejection'}>
            <Stack spacing={2}>
              <TextField
                label={isApprove ? 'Comments (optional)' : 'Reason / comments'}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                multiline
                minRows={3}
                fullWidth
              />
              <Stack direction="row" spacing={1.5}>
                <AppButton
                  variant="contained"
                  color={isApprove ? 'success' : 'error'}
                  startIcon={isApprove ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}
                  loading={isPending}
                  onClick={() => mutate()}
                >
                  {isApprove ? 'Approve Offer' : 'Reject Offer'}
                </AppButton>
                <AppButton color="inherit" onClick={() => navigate(-1)}>
                  Cancel
                </AppButton>
              </Stack>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} component="div">
        {value}
      </Typography>
    </Stack>
  )
}
