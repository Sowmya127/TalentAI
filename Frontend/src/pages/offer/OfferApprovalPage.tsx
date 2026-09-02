import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Grid, Stack, TextField, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppButton } from '@/components/common/AppButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { OfferSummaryCard } from '@/components/offer/OfferSummaryCard'
import { offerApi } from '@/api/offerApi'
import { useToast } from '@/hooks/useToast'

export default function OfferApprovalPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { offerId } = useParams<{ offerId: string }>()
  const numericId = Number(offerId)
  const [comments, setComments] = useState('')

  const queryKey = ['offer', numericId]
  const { data: offer, isLoading } = useQuery({
    queryKey,
    queryFn: () => offerApi.getOffer(numericId),
    enabled: Number.isFinite(numericId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const decisionMutation = useMutation({
    mutationFn: (decision: 'Approved' | 'Rejected') =>
      offerApi.approve(numericId, { decision, comments: comments || undefined }),
    onSuccess: (_r, decision) => {
      toast.success(decision === 'Approved' ? 'Offer approved.' : 'Offer rejected.')
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not record the decision.'),
  })

  const sendMutation = useMutation({
    mutationFn: () => offerApi.send(numericId),
    onSuccess: () => {
      toast.success('Offer sent to candidate.')
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not send the offer.'),
  })

  if (isLoading) return <LoadingSpinner fullPage label="Loading offer…" />
  if (!offer) {
    return (
      <SectionCard>
        <EmptyState title="Offer not found" description="This offer could not be loaded." />
      </SectionCard>
    )
  }

  const isPendingDecision = offer.status === 'Draft'
  const isApproved = offer.status === 'Approved'

  return (
    <>
      <PageHeader
        title="Offer Approval"
        description={offer.candidateName ?? `Offer #${offer.offerId}`}
        breadcrumbs={[{ label: 'Offers' }, { label: 'Approval' }]}
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <OfferSummaryCard offer={offer} />
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title="Decision">
            <Stack spacing={2}>
              {isPendingDecision ? (
                <>
                  <TextField
                    label="Comments (optional)"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                  />
                  <Stack direction="row" spacing={1.5}>
                    <AppButton
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleRoundedIcon />}
                      loading={decisionMutation.isPending && decisionMutation.variables === 'Approved'}
                      onClick={() => decisionMutation.mutate('Approved')}
                    >
                      Approve
                    </AppButton>
                    <AppButton
                      variant="outlined"
                      color="error"
                      startIcon={<CancelRoundedIcon />}
                      loading={decisionMutation.isPending && decisionMutation.variables === 'Rejected'}
                      onClick={() => decisionMutation.mutate('Rejected')}
                    >
                      Reject
                    </AppButton>
                  </Stack>
                </>
              ) : isApproved ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    This offer is approved and ready to send to the candidate.
                  </Typography>
                  <AppButton
                    variant="contained"
                    startIcon={<SendRoundedIcon />}
                    loading={sendMutation.isPending}
                    onClick={() => sendMutation.mutate()}
                  >
                    Send Offer
                  </AppButton>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No approval action is available for an offer in the {offer.status} state.
                </Typography>
              )}
              <AppButton color="inherit" onClick={() => navigate(-1)}>
                Back
              </AppButton>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </>
  )
}
