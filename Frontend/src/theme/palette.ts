import type { PaletteOptions } from '@mui/material/styles'

/**
 * Navy / amber palette (#000000, #14213D, #FCA311, #E5E5E5, #FFFFFF).
 * Navy is the primary (text, links, dark surfaces, default buttons); amber is
 * the accent/CTA used sparingly. Semantic status colors are kept OUT of the
 * palette (see StatusChip) so a brand tweak never changes a status meaning.
 *
 * The BRAND keys are unchanged from the previous theme so existing imports keep
 * working; only their values are repointed to the new palette.
 */
export const BRAND = {
  bg: '#FDF6EC', // warm cream — page background (matches the landing page)
  charcoal: '#14213D', // oxford navy — sidebar, auth panel, headings, chart text
  slate: '#5C6784', // muted navy — secondary text, icons, chart axes
  taupe: '#FCA311', // amber — accent (AI cards, highlights)
  steel: '#FCA311', // amber — active/highlight surfaces
  steelDark: '#E08E00', // amber hover
  border: '#D9D9D9', // hairline border on white cards
  sidebarHover: '#1E3059', // lighter navy for sidebar hover
} as const

export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#14213D',
    light: '#33415C',
    dark: '#0B1526',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#FCA311',
    light: '#FFC24D',
    dark: '#E08E00',
    contrastText: '#14213D',
  },
  success: { main: '#16A34A', light: '#86EFAC', dark: '#15803D', contrastText: '#FFFFFF' },
  warning: { main: '#D97706', light: '#FCD34D', dark: '#B45309', contrastText: '#FFFFFF' },
  error: { main: '#DC2626', light: '#FCA5A5', dark: '#B91C1C', contrastText: '#FFFFFF' },
  info: { main: '#2563EB', light: '#93C5FD', dark: '#1D4ED8', contrastText: '#FFFFFF' },
  background: {
    default: '#FDF6EC',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#14213D',
    secondary: '#5C6784',
    disabled: '#9AA3B2',
  },
  divider: '#D9D9D9',
}
