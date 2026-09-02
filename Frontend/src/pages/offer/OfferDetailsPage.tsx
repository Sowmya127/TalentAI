import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Grid, Stack, TextField } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppButton } from '@/components/common/AppButton'
import { AppDialog } from '@/components/common/AppDialog'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { ActivityTimeline, type ActivityEvent } from '@/components/common/ActivityTimeline'
import { OfferSummaryCard } from '@/components/offer/OfferSummaryCard'
import { offerApi } from '@/api/offerApi'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { RoleKey } from '@/constants/roles'
import type { Offer, OfferStatus } from '@/types/offer'

/** Ordered offer lifecycle → activity timeline, marking the current stage. */
const STAGES: { label: string; matches: OfferStatus[] }[] = [
  { label: 'Offer Drafted', matches: ['Draft', 'Approved', 'Sent', 'Accepted', 'Declined'] },
  { label: 'Approved', matches: ['Approved', 'Sent', 'Accepted', 'Declined'] },
  { label: 'Sent to Candidate', matches: ['Sent', 'Accepted', 'Declined'] },
  { label: 'Candidate Responded', matches: ['Accepted', 'Declined'] },
]

function buildTimeline(status: OfferStatus): ActivityEvent[] {
  return STAGES.map((stage) => {
    const done = stage.matches.includes(status)
    const isResponse = stage.label === 'Candidate Responded'
    return {
      label: isResponse && status === 'Declined' ? 'Offer Declined' : isResponse && status === 'Accepted' ? 'Offer Accepted' : stage.label,
      tone: done ? (status === 'Declined' && isResponse ? 'error' : 'success') : 'grey',
      done,
    }
  })
}

export default function OfferDetailsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const { offerId } = useParams<{ offerId: string }>()
  const numericId = Number(offerId)
  const [declineOpen, setDeclineOpen] = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  const queryKey = ['offer', numericId]
  const { data: offer, isLoading } = useQuery({
    queryKey,
    queryFn: () => offerApi.getOffer(numericId),
    enabled: Number.isFinite(numericId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const acceptMutation = useMutation({
    mutationFn: () => offerApi.accept(numericId),
    onSuccess: () => {
      toast.success('Offer accepted. Congratulations!')
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not accept the offer.'),
  })

  const declineMutation = useMutation({
    mutationFn: () => offerApi.decline(numericId, { declineReason }),
    onSuccess: () => {
      toast.success('Offer declined.')
      setDeclineOpen(false)
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not decline the offer.'),
  })

  if (isLoading) return <LoadingSpinner fullPage label="Loading offer…" />
  if (!offer) {
    return (
      <SectionCard>
        <EmptyState title="Offer not found" description="This offer could not be loaded." />
      </SectionCard>
    )
  }

  const canRespond = hasRole(RoleKey.CANDIDATE) && offer.status === 'Sent'

  return (
    <>
      <PageHeader
        title="Offer Details"
        description={offer.jobTitle ?? `Offer #${offer.offerId}`}
        breadcrumbs={[{ label: 'Offers' }, { label: 'Details' }]}
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2.5}>
            <OfferSummaryCard offer={offer as Offer} />
            {canRespond ? (
              <SectionCard title="Your Response">
                <Stack direction="row" spacing={1.5}>
                  <AppButton
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleRoundedIcon />}
                    loading={acceptMutation.isPending}
                    onClick={() => acceptMutation.mutate()}
                  >
                    Accept Offer
                  </AppButton>
                  <AppButton
                    variant="outlined"
                    color="error"
                    startIcon={<CancelRoundedIcon />}
                    onClick={() => {
                      setDeclineReason('')
                      setDeclineOpen(true)
                    }}
                  >
                    Decline
                  </AppButton>
                </Stack>
              </SectionCard>
            ) : null}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title="Offer Status">
            <ActivityTimeline events={buildTimeline(offer.status)} />
            <AppButton color="inherit" sx={{ mt: 1 }} onClick={() => navigate(-1)}>
              Back
            </AppButton>
          </SectionCard>
        </Grid>
      </Grid>

      <AppDialog
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline Offer"
        actions={
          <>
            <AppButton color="inherit" onClick={() => setDeclineOpen(false)}>
              Cancel
            </AppButton>
            <AppButton
              variant="contained"
              color="error"
              loading={declineMutation.isPending}
              disabled={!declineReason.trim()}
              onClick={() => declineMutation.mutate()}
            >
              Decline Offer
            </AppButton>
          </>
        }
      >
        <TextField
          label="Reason for declining"
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          multiline
          minRows={3}
          fullWidth
          autoFocus
        />
      </AppDialog>
    </>
  )
}
