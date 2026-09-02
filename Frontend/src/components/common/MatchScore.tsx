import { Box, LinearProgress, Stack, Typography } from '@mui/material'

/** Color the match score by band — high match reads green, low reads amber/red. */
function scoreColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 75) return 'success'
  if (score >= 50) return 'warning'
  return 'error'
}

export function MatchScore({ score, showBar = false }: { score: number; showBar?: boolean }) {
  const color = scoreColor(score)
  if (!showBar) {
    return (
      <Typography variant="body2" fontWeight={700} color={`${color}.main`}>
        {score}%
      </Typography>
    )
  }
  return (
    <Stack spacing={0.5} sx={{ minWidth: 120 }}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          Match
        </Typography>
        <Typography variant="caption" fontWeight={700} color={`${color}.main`}>
          {score}%
        </Typography>
      </Stack>
      <Box>
        <LinearProgress
          variant="determinate"
          value={score}
          color={color}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>
    </Stack>
  )
}
