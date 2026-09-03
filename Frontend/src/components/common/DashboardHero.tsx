import type { ReactNode } from 'react'
import { Box, Stack, Typography, alpha } from '@mui/material'
import { BRAND } from '@/theme/palette'

interface DashboardHeroProps {
  /** Big serif headline, e.g. "Welcome back, Sowmya." */
  title: string
  /** One supporting line under the headline. */
  subtitle?: string
  /** Small amber-dot pill above the headline, e.g. "2,400 roles open this week". */
  eyebrow?: string
  /** Right-aligned call-to-action (typically an amber AppButton). */
  action?: ReactNode
}

/**
 * The navy welcome banner shown at the top of every role dashboard. White text
 * on oxford navy with an amber accent — the cream page background shows around
 * it. Mirrors the "Live Now" card styling from the public landing page so the
 * signed-in app and the marketing page read as one product.
 */
export function DashboardHero({ title, subtitle, eyebrow, action }: DashboardHeroProps) {
  return (
    <Box
      sx={{
        bgcolor: BRAND.charcoal,
        color: '#FFFFFF',
        borderRadius: 3,
        px: { xs: 3, md: 4 },
        py: { xs: 3, md: 3.5 },
        mb: 3,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2.5}
      >
        <Box>
          {eyebrow ? (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                display: 'inline-flex',
                mb: 1.5,
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                bgcolor: alpha('#FFFFFF', 0.06),
                border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: BRAND.taupe }} />
              <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.85), fontWeight: 600 }}>
                {eyebrow}
              </Typography>
            </Stack>
          ) : null}
          <Typography
            component="h1"
            sx={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: 600,
              fontSize: { xs: '1.6rem', md: '2rem' },
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" sx={{ mt: 1, color: alpha('#FFFFFF', 0.72), maxWidth: 620 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
      </Stack>
    </Box>
  )
}
