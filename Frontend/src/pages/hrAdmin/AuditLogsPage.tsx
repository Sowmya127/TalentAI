import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MenuItem, Stack, TextField, Typography } from '@mui/material'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { AppButton } from '@/components/common/AppButton'
import { EmptyState } from '@/components/common/EmptyState'
import { adminApi } from '@/api/adminApi'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDateTime } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'
import type { AuditLogEntry } from '@/types/admin'

const ENTITY_TYPES = [
  { value: '', label: 'All entities' },
  { value: 'Application', label: 'Application' },
  { value: 'Job', label: 'Job' },
  { value: 'User', label: 'User' },
  { value: 'Offer', label: 'Offer' },
  { value: 'Interview', label: 'Interview' },
]

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')
  const debouncedId = useDebounce(entityId)

  const { data, isLoading } = useQuery({
    queryKey: ['audit', entityType, debouncedId],
    queryFn: () =>
      adminApi.audit({
        entityType: entityType || undefined,
        entityId: debouncedId || undefined,
        page: 1,
        size: 50,
      }),
  })

  const columns: DataTableColumn<AuditLogEntry>[] = [
    { key: 'timestamp', header: 'When', render: (r) => formatDateTime(r.timestamp) },
    { key: 'user', header: 'User', render: (r) => <Typography variant="body2" fontWeight={600}>{r.user}</Typography> },
    { key: 'action', header: 'Action' },
    { key: 'entity', header: 'Entity' },
  ]

  const rows = data?.data ?? []
  const hasFilters = Boolean(entityType || entityId)

  return (
    <>
      <PageHeader
        title="Audit Logs"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.hrAdminDashboard }, { label: 'Audit Logs' }]}
      />

      <SectionCard>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <TextField
              select
              label="Entity type"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              {ENTITY_TYPES.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Entity ID"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="e.g. 9001"
              sx={{ minWidth: 160 }}
            />
            {hasFilters ? (
              <AppButton
                size="small"
                color="inherit"
                onClick={() => {
                  setEntityType('')
                  setEntityId('')
                }}
              >
                Clear
              </AppButton>
            ) : null}
          </Stack>

          {!isLoading && rows.length === 0 ? (
            <EmptyState
              icon={<HistoryOutlinedIcon fontSize="medium" />}
              title="No audit entries"
              description="Significant create, update, and delete actions will be recorded here."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(r) => `${r.timestamp}-${r.entity}-${r.action}`}
              loading={isLoading}
            />
          )}
        </Stack>
      </SectionCard>
    </>
  )
}
