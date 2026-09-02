import { useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconButton, Menu, MenuItem, MenuList, Stack, TextField, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { SearchFilterBar } from '@/components/common/SearchFilterBar'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusChip } from '@/components/common/StatusChip'
import { AppButton } from '@/components/common/AppButton'
import { AppPagination } from '@/components/common/AppPagination'
import { EmptyState } from '@/components/common/EmptyState'
import { jobApi } from '@/api/jobApi'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/hooks/useToast'
import { buildPath, ROUTES } from '@/constants/routes'
import type { JobDetail, JobStatus } from '@/types/job'

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'PendingApproval', label: 'Pending Approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Published', label: 'Published' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Archived', label: 'Archived' },
]

export default function ViewJobsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const debouncedSearch = useDebounce(search)

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [menuJob, setMenuJob] = useState<JobDetail | null>(null)

  const queryKey = ['recruiterJobs', debouncedSearch, status, page]
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      jobApi.search({
        skills: debouncedSearch || undefined,
        status: (status || undefined) as JobStatus | undefined,
        page,
        size: pageSize,
      }),
  })

  const actionMutation = useMutation({
    mutationFn: ({ job, action }: { job: JobDetail; action: 'publish' | 'close' | 'archive' }) =>
      jobApi[action](job.jobId),
    onSuccess: (_res, { action }) => {
      toast.success(`Job ${action === 'publish' ? 'published' : action === 'close' ? 'closed' : 'archived'}.`)
      queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] })
      closeMenu()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Action failed.'),
  })

  const openMenu = (e: MouseEvent<HTMLElement>, job: JobDetail) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
    setMenuJob(job)
  }
  const closeMenu = () => {
    setMenuAnchor(null)
    setMenuJob(null)
  }

  const columns: DataTableColumn<JobDetail>[] = [
    { key: 'title', header: 'Job Title', render: (r) => <Typography variant="body2" fontWeight={600}>{r.title}</Typography> },
    { key: 'department', header: 'Department', render: (r) => r.department ?? '—' },
    { key: 'location', header: 'Location' },
    { key: 'status', header: 'Status', render: (r) => (r.status ? <StatusChip status={r.status} /> : '—') },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <IconButton size="small" onClick={(e) => openMenu(e, r)} aria-label="Job actions">
          <MoreVertRoundedIcon fontSize="small" />
        </IconButton>
      ),
    },
  ]

  const hasFilters = Boolean(search || status)
  const jobs = data?.data ?? []

  return (
    <>
      <PageHeader
        title="Jobs"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.recruiterDashboard }, { label: 'Jobs' }]}
        actions={
          <AppButton variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate(ROUTES.recruiterJobCreate)}>
            Create Job
          </AppButton>
        }
      />

      <SectionCard>
        <Stack spacing={2.5}>
          <SearchFilterBar
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            searchPlaceholder="Search jobs by skill…"
            hasActiveFilters={hasFilters}
            onClearFilters={() => {
              setSearch('')
              setStatus('')
              setPage(1)
            }}
            filters={
              <TextField
                select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPage(1)
                }}
                sx={{ minWidth: 180 }}
              >
                {STATUS_FILTERS.map((f) => (
                  <MenuItem key={f.value} value={f.value}>
                    {f.label}
                  </MenuItem>
                ))}
              </TextField>
            }
          />

          {!isLoading && jobs.length === 0 ? (
            <EmptyState
              icon={<WorkOutlineIcon fontSize="medium" />}
              title="No Jobs Yet"
              description="Create your first job requisition to start hiring."
              action={
                <AppButton variant="contained" onClick={() => navigate(ROUTES.recruiterJobCreate)}>
                  Create Job
                </AppButton>
              }
            />
          ) : (
            <DataTable
              columns={columns}
              rows={jobs}
              rowKey={(r) => r.jobId}
              loading={isLoading}
              onRowClick={(r) => navigate(buildPath(ROUTES.recruiterJobApplicants, { jobId: r.jobId }))}
            />
          )}

          {data?.totalRecords ? (
            <AppPagination page={page} pageSize={pageSize} totalRecords={data.totalRecords} onPageChange={setPage} />
          ) : null}
        </Stack>
      </SectionCard>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuList dense sx={{ minWidth: 180 }}>
          <MenuItem
            onClick={() => {
              if (menuJob) navigate(buildPath(ROUTES.recruiterJobEdit, { jobId: menuJob.jobId }))
              closeMenu()
            }}
          >
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (menuJob) navigate(buildPath(ROUTES.recruiterJobApplicants, { jobId: menuJob.jobId }))
              closeMenu()
            }}
          >
            View Applicants
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (menuJob) navigate(buildPath(ROUTES.recruiterAiMatchResults, { jobId: menuJob.jobId }))
              closeMenu()
            }}
          >
            AI Match Results
          </MenuItem>
          {menuJob?.status === 'Approved' ? (
            <MenuItem onClick={() => menuJob && actionMutation.mutate({ job: menuJob, action: 'publish' })}>
              Publish
            </MenuItem>
          ) : null}
          {menuJob?.status === 'Published' ? (
            <MenuItem onClick={() => menuJob && actionMutation.mutate({ job: menuJob, action: 'close' })}>
              Close
            </MenuItem>
          ) : null}
          <MenuItem onClick={() => menuJob && actionMutation.mutate({ job: menuJob, action: 'archive' })}>
            Archive
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  )
}
