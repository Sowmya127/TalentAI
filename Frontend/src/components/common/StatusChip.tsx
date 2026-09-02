import { Chip, type ChipProps } from '@mui/material'

/**
 * Semantic status colors, intentionally SEPARATE from the Urban Slate brand
 * palette — universally understood workflow colors (blue/cyan/purple/green/
 * red/amber), never taupe/slate. A brand tweak must never change what a
 * status color means. Rendered as soft-background pills.
 */
interface StatusStyle {
  fg: string
  bg: string
}

const BLUE: StatusStyle = { fg: '#1D4ED8', bg: '#E5EDFB' }
const CYAN: StatusStyle = { fg: '#0E7490', bg: '#E0F2F7' }
const PURPLE: StatusStyle = { fg: '#6D28D9', bg: '#EFE7FB' }
const GREEN: StatusStyle = { fg: '#15803D', bg: '#E4F4E9' }
const RED: StatusStyle = { fg: '#B91C1C', bg: '#FBE7E7' }
const AMBER: StatusStyle = { fg: '#B45309', bg: '#FBF0DE' }
const INDIGO: StatusStyle = { fg: '#4338CA', bg: '#E7E7FB' }
const GREY: StatusStyle = { fg: '#57534E', bg: '#EDEBEA' }

const STATUS_STYLES: Record<string, StatusStyle> = {
  // Job requisition lifecycle
  Draft: GREY,
  PendingApproval: AMBER,
  Approved: BLUE,
  Published: GREEN,
  Closed: GREY,
  Archived: GREY,
  Cancelled: RED,

  // Application / pipeline
  Applied: BLUE,
  Screened: CYAN,
  Shortlisted: CYAN,
  UnderReview: AMBER,
  OnHold: AMBER,
  Pending: AMBER,
  Selected: GREEN,
  Rejected: RED,
  Withdrawn: GREY,
  ResponsesRecorded: BLUE,
  Eligible: GREEN,
  NotEligible: RED,

  // Interview
  Scheduled: PURPLE,
  Interview: PURPLE,
  Rescheduled: AMBER,
  Completed: GREEN,
  Submitted: GREEN,

  // Offer
  OfferSent: INDIGO,
  Sent: INDIGO,
  Accepted: GREEN,
  Declined: RED,
  Expired: GREY,
  Rescinded: RED,

  // Background check
  Initiated: BLUE,
  Clear: GREEN,
  Discrepancy: RED,

  // User account
  Active: GREEN,
  Inactive: GREY,
  Suspended: AMBER,

  // Notification
  Failed: RED,

  // Hire outcome
  Hired: GREEN,
}

interface StatusChipProps extends Omit<ChipProps, 'color' | 'label' | 'variant'> {
  status: string
}

function humanize(status: string): string {
  return status.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function StatusChip({ status, size = 'small', sx, ...rest }: StatusChipProps) {
  const style = STATUS_STYLES[status] ?? GREY
  return (
    <Chip
      label={humanize(status)}
      size={size}
      sx={{
        color: style.fg,
        backgroundColor: style.bg,
        fontWeight: 600,
        borderRadius: 1.5,
        border: 'none',
        '& .MuiChip-label': { px: 1.25 },
        ...sx,
      }}
      {...rest}
    />
  )
}
