import { Pagination, Stack, Typography } from '@mui/material'

interface AppPaginationProps {
  /** 1-indexed, matching the API spec's custom {page, size, totalRecords} envelopes. */
  page: number
  pageSize: number
  totalRecords: number
  onPageChange: (page: number) => void
}

export function AppPagination({ page, pageSize, totalRecords, onPageChange }: AppPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalRecords / pageSize))
  if (totalRecords === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalRecords)

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        Showing {from}–{to} of {totalRecords}
      </Typography>
      <Pagination
        page={page}
        count={pageCount}
        onChange={(_, value) => onPageChange(value)}
        color="primary"
        shape="rounded"
      />
    </Stack>
  )
}
