import { Divider, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { SectionCard } from '@/components/common/SectionCard'
import { StatusChip } from '@/components/common/StatusChip'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Offer } from '@/types/offer'

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} component="div" textAlign="right">
        {value}
      </Typography>
    </Stack>
  )
}

export function OfferSummaryCard({ offer, title = 'Offer Details' }: { offer: Offer; title?: string }) {
  return (
    <SectionCard title={title}>
      <Stack spacing={2}>
        <Row label="Status" value={<StatusChip status={offer.status} />} />
        <Divider />
        {offer.candidateName ? <Row label="Candidate" value={offer.candidateName} /> : null}
        {offer.jobTitle ? <Row label="Role" value={offer.jobTitle} /> : null}
        <Row label="Base Salary" value={formatCurrency(offer.compensation.baseSalary, offer.compensation.currency)} />
        {offer.compensation.variablePay != null ? (
          <Row label="Variable Pay" value={formatCurrency(offer.compensation.variablePay, offer.compensation.currency)} />
        ) : null}
        <Row
          label="Total Compensation"
          value={formatCurrency(
            offer.compensation.baseSalary + (offer.compensation.variablePay ?? 0),
            offer.compensation.currency,
          )}
        />
        <Row label="Joining Date" value={formatDate(offer.joiningDate)} />
      </Stack>
    </SectionCard>
  )
}
