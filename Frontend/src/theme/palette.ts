import type { PaletteOptions } from '@mui/material/styles'

/**
 * "Urban Slate" palette. Brand tones are intentionally calm and premium;
 * semantic status colors are kept OUT of the palette (see StatusChip) so
 * a brand tweak never changes what a status color means.
 */
export const BRAND = {
  bg: '#E9E6E7', // soft light grey — page background
  charcoal: '#5E5653', // warm charcoal — titles, body, sidebar bg
  slate: '#7B7F8A', // slate grey — secondary text, icons
  taupe: '#AB978C', // warm taupe — accent only (AI cards, badges)
  steel: '#6B7C98', // dusty steel blue — primary brand
  steelDark: '#5F6F89', // primary button hover
  border: '#D8D6D7', // light border/divider
  sidebarHover: '#6A625F', // sidebar item hover
} as const

export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: BRAND.steel,
    light: '#8B99B0',
    dark: BRAND.steelDark,
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: BRAND.taupe,
    light: '#C4B4AC',
    dark: '#8F7C71',
    contrastText: '#FFFFFF',
  },
  // Semantic colors retained for icons/alerts; status chips use their own map.
  success: { main: '#16A34A', light: '#86EFAC', dark: '#15803D', contrastText: '#FFFFFF' },
  warning: { main: '#D97706', light: '#FCD34D', dark: '#B45309', contrastText: '#FFFFFF' },
  error: { main: '#DC2626', light: '#FCA5A5', dark: '#B91C1C', contrastText: '#FFFFFF' },
  info: { main: '#2563EB', light: '#93C5FD', dark: '#1D4ED8', contrastText: '#FFFFFF' },
  background: {
    default: BRAND.bg,
    paper: '#FFFFFF',
  },
  text: {
    primary: BRAND.charcoal,
    secondary: BRAND.slate,
    disabled: '#A8A6A2',
  },
  divider: BRAND.border,
}
