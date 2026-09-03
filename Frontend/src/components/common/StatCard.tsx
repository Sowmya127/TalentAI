import type { ReactNode } from 'react'
import { Box, Card, Stack, Typography, alpha, useTheme } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  trend?: { value: number; label?: string }
  /** Small muted line under the value, e.g. "+1 this week" or "Interview likely next". */
  caption?: string
}

export function StatCard({ label, value, icon, color = 'primary', trend, caption }: StatCardProps) {
  const theme = useTheme()
  const mainColor = theme.palette[color].main
  const isPositive = (trend?.value ?? 0) >= 0

  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4">{value}</Typography>
          {caption ? (
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          ) : null}
          {trend ? (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
              {isPositive ? (
                <TrendingUpIcon fontSize="small" color="success" />
              ) : (
                <TrendingDownIcon fontSize="small" color="error" />
              )}
              <Typography variant="caption" color={isPositive ? 'success.main' : 'error.main'} fontWeight={600}>
                {isPositive ? '+' : ''}
                {trend.value}%
              </Typography>
              {trend.label ? (
                <Typography variant="caption" color="text.secondary">
                  {trend.label}
                </Typography>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
        {icon ? (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(mainColor, 0.12),
              color: mainColor,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        ) : null}
      </Stack>
    </Card>
  )
}
