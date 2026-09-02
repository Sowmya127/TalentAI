import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stack, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { AppButton } from '@/components/common/AppButton'
import { AppDialog } from '@/components/common/AppDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { FormTextField } from '@/components/form/FormTextField'
import { adminApi } from '@/api/adminApi'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import { createRoleSchema, type CreateRoleFormValues } from './schemas'
import type { Role } from '@/types/admin'

export default function RoleManagementPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['roles'], queryFn: adminApi.getRoles })

  const { control, handleSubmit, reset } = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '', permissions: '' },
  })

  const createMutation = useMutation({
    mutationFn: (values: CreateRoleFormValues) =>
      adminApi.createRole({
        name: values.name,
        permissions: (values.permissions ?? '')
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success('Role created.')
      setCreateOpen(false)
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create the role.'),
  })

  const columns: DataTableColumn<Role>[] = [
    { key: 'roleId', header: 'ID', width: 80 },
    { key: 'name', header: 'Role Name', render: (r) => <Typography variant="body2" fontWeight={600}>{r.name}</Typography> },
  ]

  const roles = data?.data ?? []

  return (
    <>
      <PageHeader
        title="Role Management"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.hrAdminDashboard }, { label: 'Role Management' }]}
        actions={
          <AppButton
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              reset({ name: '', permissions: '' })
              setCreateOpen(true)
            }}
          >
            Create Role
          </AppButton>
        }
      />

      <SectionCard noPadding>
        {!isLoading && roles.length === 0 ? (
          <EmptyState
            icon={<AdminPanelSettingsOutlinedIcon fontSize="medium" />}
            title="No roles yet"
            description="Define roles to control what each user can access."
          />
        ) : (
          <DataTable columns={columns} rows={roles} rowKey={(r) => r.roleId} loading={isLoading} />
        )}
      </SectionCard>

      <AppDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Role"
        actions={
          <>
            <AppButton color="inherit" onClick={() => setCreateOpen(false)}>
              Cancel
            </AppButton>
            <AppButton variant="contained" loading={createMutation.isPending} onClick={handleSubmit((v) => createMutation.mutate(v))}>
              Create Role
            </AppButton>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <FormTextField name="name" control={control} label="Role name" />
          <FormTextField
            name="permissions"
            control={control}
            label="Permissions (optional)"
            helperText="Comma-separated, e.g. VIEW_CANDIDATE, SUBMIT_FEEDBACK"
          />
        </Stack>
      </AppDialog>
    </>
  )
}
