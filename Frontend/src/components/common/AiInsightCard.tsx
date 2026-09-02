import type { ReactNode } from 'react'
import { Box, Card, Stack, Typography, alpha } from '@mui/material'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { BRAND } from '@/theme/palette'

/**
 * AI-insight surface. Uses the taupe accent (#AB978C) deliberately and
 * sparingly, per the design system — reserved for AI/decision-support
 * content so it reads as distinct from ordinary cards. Never a primary action.
 */
export function AiInsightCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderColor: alpha(BRAND.taupe, 0.5),
        backgroundColor: alpha(BRAND.taupe, 0.08),
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: title ? 1.5 : 0 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: BRAND.taupe,
            color: '#FFFFFF',
          }}
        >
          <AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />
        </Box>
        {title ? (
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#8F7C71' }}>
            {title}
          </Typography>
        ) : null}
      </Stack>
      {children}
    </Card>
  )
}
