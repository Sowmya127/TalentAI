import { Box, CircularProgress, Stack, Typography } from '@mui/material'

interface LoadingSpinnerProps {
  label?: string
  fullPage?: boolean
  size?: number
}

export function LoadingSpinner({ label, fullPage = false, size = 32 }: LoadingSpinnerProps) {
  const content = (
    <Stack alignItems="center" spacing={1.5} role="status" aria-live="polite">
      <CircularProgress size={size} />
      {label ? (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      ) : null}
    </Stack>
  )

  if (!fullPage) return content

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        width: '100%',
      }}
    >
      {content}
    </Box>
  )
}
