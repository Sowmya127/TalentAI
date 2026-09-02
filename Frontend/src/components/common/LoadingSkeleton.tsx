import { Box, Skeleton, Stack } from '@mui/material'

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Stack spacing={1} sx={{ width: '100%', py: 1 }}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Stack key={rowIndex} direction="row" spacing={2} sx={{ width: '100%' }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="rounded" height={32} sx={{ flex: 1 }} />
          ))}
        </Stack>
      ))}
    </Stack>
  )
}

export function CardSkeleton({ height = 120 }: { height?: number }) {
  return <Skeleton variant="rounded" height={height} sx={{ width: '100%', borderRadius: 3 }} />
}

export function StatCardSkeleton() {
  return (
    <Box sx={{ p: 2.5 }}>
      <Skeleton variant="text" width="50%" />
      <Skeleton variant="text" width="35%" height={40} />
    </Box>
  )
}
