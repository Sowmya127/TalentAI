import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Chip, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { SearchFilterBar } from '@/components/common/SearchFilterBar'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { AppButton } from '@/components/common/AppButton'
import { AppPagination } from '@/components/common/AppPagination'
import { AppDialog } from '@/components/common/AppDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { registrationApi } from '@/api/registrationApi'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/hooks/useToast'
import { formatDateTime } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'
import type { RegistrationRequestSummary } from '@/types/registration'

const STATUS_FILTERS = [
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: '', label: 'All' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; fg: string; bg: string }> = {
    PENDING_APPROVAL: { label: 'Pending', fg: '#B45309', bg: '#FBF0DE' },
    APPROVED: { label: 'Approved', fg: '#15803D', bg: '#E4F4E9' },
    REJECTED: { label: 'Rejected', fg: '#B91C1C', bg: '#FBE7E7' },
  }
  const s = map[status] ?? { label: status, fg: '#57534E', bg: '#EDEBEA' }
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ color: s.fg, backgroundColor: s.bg, fontWeight: 600, borderRadius: 1.5, '& .MuiChip-label': { px: 1.25 } }}
    />
  )
}

export default function RegistrationApprovalsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState('PENDING_APPROVAL')
  const [search, setSearch] = useState('')
  const [direction, setDirection] = useState('desc')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const debouncedSearch = useDebounce(search)

  const [approving, setApproving] = useState<RegistrationRequestSummary | null>(null)
  const [rejecting, setRejecting] = useState<RegistrationRequestSummary | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [detailId, setDetailId] = useState<number | null>(null)

  const queryKey = ['registrationRequests', status, debouncedSearch, direction, page]
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      registrationApi.list({
        status: status || undefined,
        search: debouncedSearch || undefined,
        page,
        size: pageSize,
        sortBy: 'submittedAt',
        direction,
      }),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['registrationRequests'] })

  const approveMutation = useMutation({
    mutationFn: (id: number) => registrationApi.approve(id),
    onSuccess: () => {
      toast.success('Registration approved.')
      invalidate()
      setApproving(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not approve.'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => registrationApi.reject(id, reason),
    onSuccess: () => {
      toast.success('Registration rejected.')
      invalidate()
      setRejecting(null)
      setRejectReason('')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not reject.'),
  })

  const detailQuery = useQuery({
    queryKey: ['registrationRequestDetail', detailId],
    queryFn: () => registrationApi.detail(detailId as number),
    enabled: detailId !== null,
  })

  const rows = data?.data ?? []
  const hasFilters = Boolean(search || status !== 'PENDING_APPROVAL')

  const columns: DataTableColumn<RegistrationRequestSummary>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Applicant',
        render: (r) => (
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600}>
              {r.name ?? '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {r.email}
            </Typography>
          </Stack>
        ),
      },
      { key: 'requestedRole', header: 'Role', render: (r) => r.requestedRole ?? '—' },
      { key: 'companyName', header: 'Company', render: (r) => r.companyName ?? '—' },
      { key: 'submittedAt', header: 'Submitted', render: (r) => formatDateTime(r.submittedAt) },
      { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (r) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <AppButton size="small" variant="text" startIcon={<VisibilityOutlinedIcon />} onClick={() => setDetailId(r.requestId)}>
              View
            </AppButton>
            {r.status === 'PENDING_APPROVAL' ? (
              <>
                <AppButton size="small" variant="contained" startIcon={<CheckRoundedIcon />} onClick={() => setApproving(r)}>
                  Approve
                </AppButton>
                <AppButton size="small" color="inherit" startIcon={<CloseRoundedIcon />} onClick={() => setRejecting(r)}>
                  Reject
                </AppButton>
              </>
            ) : null}
          </Stack>
        ),
      },
    ],
    [],
  )

  const detail = detailQuery.data

  return (
    <>
      <PageHeader
        title="Registration Approvals"
        description="Review and approve or reject internal-role self-registrations."
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.hrAdminDashboard }, { label: 'Registrations' }]}
      />

      <SectionCard>
        <Stack spacing={2.5}>
          <SearchFilterBar
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            searchPlaceholder="Search by name, email or company…"
            hasActiveFilters={hasFilters}
            onClearFilters={() => {
              setSearch('')
              setStatus('PENDING_APPROVAL')
              setPage(1)
            }}
            filters={
              <Stack direction="row" spacing={1.5}>
                <TextField
                  select
                  label="Status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value)
                    setPage(1)
                  }}
                  sx={{ minWidth: 150 }}
                >
                  {STATUS_FILTERS.map((f) => (
                    <MenuItem key={f.value} value={f.value}>
                      {f.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Sort"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="desc">Newest first</MenuItem>
                  <MenuItem value="asc">Oldest first</MenuItem>
                </TextField>
              </Stack>
            }
          />

          {!isLoading && rows.length === 0 ? (
            <EmptyState
              icon={<HowToRegOutlinedIcon fontSize="medium" />}
              title="No registration requests"
              description="Self-registrations awaiting review will appear here."
            />
          ) : (
            <DataTable columns={columns} rows={rows} rowKey={(r) => r.requestId} loading={isLoading} />
          )}

          {data?.totalRecords ? (
            <AppPagination page={page} pageSize={pageSize} totalRecords={data.totalRecords} onPageChange={setPage} />
          ) : null}
        </Stack>
      </SectionCard>

      {/* Approve */}
      <ConfirmDialog
        open={Boolean(approving)}
        title="Approve registration"
        message={`Approve ${approving?.name ?? 'this user'} as ${approving?.requestedRole ?? ''}? Their account will be activated and the role assigned.`}
        confirmLabel="Approve"
        loading={approveMutation.isPending}
        onConfirm={() => approving && approveMutation.mutate(approving.requestId)}
        onCancel={() => setApproving(null)}
      />

      {/* Reject */}
      {rejecting ? (
        <AppDialog
          open={Boolean(rejecting)}
          onClose={() => setRejecting(null)}
          title="Reject registration"
          actions={
            <>
              <AppButton color="inherit" onClick={() => setRejecting(null)}>
                Cancel
              </AppButton>
              <AppButton
                variant="contained"
                color="error"
                loading={rejectMutation.isPending}
                disabled={!rejectReason.trim()}
                onClick={() => rejecting && rejectMutation.mutate({ id: rejecting.requestId, reason: rejectReason.trim() })}
              >
                Reject
              </AppButton>
            </>
          }
        >
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Rejecting {rejecting.name ?? 'this user'} ({rejecting.email}). The reason is shown to the user.
            </Typography>
            <TextField
              label="Reason for rejection"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              multiline
              minRows={2}
              fullWidth
              autoFocus
            />
          </Stack>
        </AppDialog>
      ) : null}

      {/* Details + history */}
      {detailId !== null ? (
        <AppDialog
          open={detailId !== null}
          onClose={() => setDetailId(null)}
          title="Registration details"
          actions={
            <AppButton color="inherit" onClick={() => setDetailId(null)}>
              Close
            </AppButton>
          }
        >
          {detailQuery.isLoading || !detail ? (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          ) : (
            <Stack spacing={1.5} sx={{ minWidth: 320 }}>
              <DetailRow label="Name" value={detail.name} />
              <DetailRow label="Email" value={detail.email} />
              <DetailRow label="Phone" value={detail.phone} />
              <DetailRow label="Requested role" value={detail.requestedRole} />
              <DetailRow label="Company" value={detail.companyName} />
              <DetailRow label="Work email" value={detail.organizationEmail} />
              <DetailRow label="Status" value={detail.status} />
              <DetailRow label="Submitted" value={formatDateTime(detail.submittedAt)} />
              {detail.reviewedByName ? <DetailRow label="Reviewed by" value={detail.reviewedByName} /> : null}
              {detail.rejectionReason ? <DetailRow label="Rejection reason" value={detail.rejectionReason} /> : null}

              <Divider />
              <Typography variant="subtitle2">Approval history</Typography>
              {detail.history.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No decisions recorded yet.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {detail.history.map((h) => (
                    <Box key={h.approvalId} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 1.5, p: 1.25 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" fontWeight={600}>
                          {h.decision}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(h.actionDate)}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        by {h.approverName ?? `#${h.approverId}`}
                        {h.comments ? ` — ${h.comments}` : ''}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          )}
        </AppDialog>
      ) : null}
    </>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value ?? '—'}
      </Typography>
    </Stack>
  )
}
