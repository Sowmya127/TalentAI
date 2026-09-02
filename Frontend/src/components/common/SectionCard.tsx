import type { ReactNode } from 'react'
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material'

interface SectionCardProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  noPadding?: boolean
}

export function SectionCard({ title, subtitle, actions, children, noPadding = false }: SectionCardProps) {
  return (
    <Card>
      {title ? (
        <>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2 }}>
            <Box>
              <Typography variant="h6">{title}</Typography>
              {subtitle ? (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
            {actions}
          </Stack>
          <Divider />
        </>
      ) : null}
      <CardContent sx={noPadding ? { p: '0 !important' } : undefined}>{children}</CardContent>
    </Card>
  )
}
