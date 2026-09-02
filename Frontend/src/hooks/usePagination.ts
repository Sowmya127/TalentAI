import { useState } from 'react'

/** Zero-indexed page state, matching MUI TablePagination's convention. */
export function usePagination(initialPageSize = 10) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const onPageChange = (newPage: number) => setPage(newPage)
  const onPageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }
  const reset = () => setPage(0)

  return { page, pageSize, onPageChange, onPageSizeChange, reset }
}
