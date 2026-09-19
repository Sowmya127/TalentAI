import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Chip, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { SearchFilterBar } from '@/components/common/SearchFilterBar'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { AppPagination } from '@/components/common/AppPagination'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { candidateApi } from '@/api/candidateApi'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/hooks/useToast'
import { ROUTES, buildPath } from '@/constants/routes'
import type { CandidateSearchResult } from '@/types/candidate'

export default function CandidateSearchPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { page, pageSize, onPageChange } = usePagination(10)

  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [minExperience, setMinExperience] = useState('')
  const debouncedSearch = useDebounce(search)
  const debouncedLocation = useDebounce(location)
  const debouncedMinExp = useDebounce(minExperience)

  const [toDelete, setToDelete] = useState<CandidateSearchResult | null>(null)

  const minExpNumber = debouncedMinExp.trim() === '' ? undefined : Number(debouncedMinExp)

  const queryKey = ['candidateSearch', debouncedSearch, debouncedLocation, minExpNumber, page, pageSize]
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      candidateApi.search({
        q: debouncedSearch || undefined,
        location: debouncedLocation || undefined,
        minExperience: Number.isFinite(minExpNumber) ? minExpNumber : undefined,
        page: page + 1,
        size: pageSize,
        sortBy: 'experience',
        direction: 'desc',
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (candidateId: number) => candidateApi.remove(candidateId),
    onSuccess: () => {
      toast.success('Candidate removed.')
      setToDelete(null)
      queryClient.invalidateQueries({ queryKey: ['candidateSearch'] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove the candidate.'),
  })

  const columns: DataTableColumn<CandidateSearchResult>[] = [
    {
      key: 'name',
      header: 'Candidate',
      render: (c) => (
        <Typography variant="body2" fontWeight={600}>
          {c.name ?? '—'}
        </Typography>
      ),
    },
    { key: 'email', header: 'Email', render: (c) => c.email ?? '—' },
    { key: 'location', header: 'Location', render: (c) => c.location ?? '—' },
    {
      key: 'experience',
      header: 'Experience',
      render: (c) => (c.experience != null ? `${c.experience} yrs` : '—'),
    },
    {
      key: 'skills',
      header: 'Skills',
      render: (c) =>
        c.skills.length ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {c.skills.slice(0, 4).map((s) => (
              <Chip key={s} label={s} size="small" />
            ))}
            {c.skills.length > 4 ? <Chip label={`+${c.skills.length - 4}`} size="small" variant="outlined" /> : null}
          </Stack>
        ) : (
          '—'
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="View profile">
            <IconButton
              size="small"
              aria-label="View candidate"
              onClick={() => navigate(buildPath(ROUTES.recruiterCandidateDetails, { candidateId: c.candidateId }))}
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove candidate">
            <IconButton size="small" color="error" aria-label="Remove candidate" onClick={() => setToDelete(c)}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ]

  const rows = data?.data ?? []
  const hasFilters = Boolean(search || location || minExperience)

  return (
    <>
      <PageHeader
        title="Candidate Search"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.recruiterDashboard }, { label: 'Candidate Search' }]}
      />

      <SectionCard>
        <Stack spacing={2.5}>
          <SearchFilterBar
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v)
              onPageChange(0)
            }}
            searchPlaceholder="Search by name, email or location…"
            hasActiveFilters={hasFilters}
            onClearFilters={() => {
              setSearch('')
              setLocation('')
              setMinExperience('')
              onPageChange(0)
            }}
            filters={
              <>
                <TextField
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    onPageChange(0)
                  }}
                  label="Location"
                  sx={{ minWidth: 170 }}
                />
                <TextField
                  value={minExperience}
                  onChange={(e) => {
                    setMinExperience(e.target.value)
                    onPageChange(0)
                  }}
                  label="Min experience (yrs)"
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  sx={{ minWidth: 170 }}
                />
              </>
            }
          />

          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(c) => c.candidateId}
            loading={isLoading}
            emptyTitle="No candidates found"
            emptyDescription="Adjust your search or filters to find candidates."
          />

          {data ? (
            <AppPagination
              page={page + 1}
              pageSize={pageSize}
              totalRecords={data.totalRecords ?? 0}
              onPageChange={(p) => onPageChange(p - 1)}
            />
          ) : null}
        </Stack>
      </SectionCard>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Remove candidate"
        message={`Remove ${toDelete?.name ?? 'this candidate'} from the platform? Their profile will no longer appear in searches.`}
        confirmLabel="Remove"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.candidateId)}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
