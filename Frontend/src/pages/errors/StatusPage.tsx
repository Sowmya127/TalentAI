import type { ReactNode } from 'react'
import { Box, Stack, Typography } from '@mui/material'

interface StatusPageProps {
  code?: string
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function StatusPage({ code, icon, title, description, action }: StatusPageProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        bgcolor: 'background.default',
      }}
    >
      <Stack alignItems="center" spacing={2} sx={{ textAlign: 'center', maxWidth: 420 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            color: 'primary.main',
          }}
        >
          {icon}
        </Box>
        {code ? (
          <Typography variant="overline" color="text.secondary" letterSpacing={2}>
            {code}
          </Typography>
        ) : null}
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        {action}
      </Stack>
    </Box>
  )
}
