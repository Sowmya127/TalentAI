import type { TypographyVariantsOptions } from '@mui/material/styles'

const fontFamily = [
  'Inter',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  'Helvetica',
  'Arial',
  'sans-serif',
].join(',')

export const typography: TypographyVariantsOptions = {
  fontFamily,
  h1: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.02em' },
  h2: { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.02em' },
  h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.35 },
  h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
  h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
  h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
  subtitle1: { fontSize: '0.9375rem', fontWeight: 500 },
  subtitle2: { fontSize: '0.8125rem', fontWeight: 500 },
  body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
  body2: { fontSize: '0.8125rem', lineHeight: 1.6 },
  button: { fontWeight: 600, textTransform: 'none' as const },
  caption: { fontSize: '0.75rem', color: '#6B7280' },
  overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em' },
}
