export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const a = firstName?.trim()?.[0] ?? ''
  const b = lastName?.trim()?.[0] ?? ''
  return (a + b).toUpperCase() || '?'
}

export function initialsFromFullName(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || '?'
}

// Brand-aligned avatar backgrounds (navy / slate / amber-bronze family) so
// every avatar stays on the cream/navy/amber theme. All are dark enough for
// the light initials the Avatar renders on top.
const AVATAR_PALETTE = [
  '#14213D', // oxford navy
  '#233457', // navy 700
  '#33415C', // navy 600
  '#5C6784', // slate
  '#4A5B7C', // slate-navy
  '#E08E00', // amber dark
  '#B45309', // bronze
  '#8A6D3B', // muted gold
]

export function colorFromString(value: string): string {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function isSameDay(value: string | null | undefined, other: Date): boolean {
  if (!value) return false
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return false
  return (
    d.getFullYear() === other.getFullYear() &&
    d.getMonth() === other.getMonth() &&
    d.getDate() === other.getDate()
  )
}

export function formatCurrency(value?: number | null, currency = 'INR'): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    value,
  )
}
