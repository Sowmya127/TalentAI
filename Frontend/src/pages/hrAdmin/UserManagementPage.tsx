import { useState, type MouseEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Grid, IconButton, Menu, MenuItem, MenuList, Stack, TextField, Typography } from '@mui/material'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { SearchFilterBar } from '@/components/common/SearchFilterBar'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusChip } from '@/components/common/StatusChip'
import { AppAvatar } from '@/components/common/AppAvatar'
import { AppButton } from '@/components/common/AppButton'
import { AppDialog } from '@/components/common/AppDialog'
import { AppPagination } from '@/components/common/AppPagination'
import { FormTextField } from '@/components/form/FormTextField'
import { FormSelect } from '@/components/form/FormSelect'
import { userApi } from '@/api/userApi'
import { usePagination } from '@/hooks/usePagination'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/hooks/useToast'
import { ROLE_LABELS, RoleKey } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { createUserSchema, editUserSchema, type CreateUserFormValues, type EditUserFormValues } from './schemas'
import type { UserResponse, UserStatus } from '@/types/user'

const INTERNAL_ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as RoleKey[])
  .filter((k) => k !== RoleKey.CANDIDATE)
  .map((k) => ({ value: ROLE_LABELS[k], label: ROLE_LABELS[k] }))

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Suspended', label: 'Suspended' },
]

export default function UserManagementPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { page, pageSize, onPageChange } = usePagination(20)

  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)

  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserResponse | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [menuUser, setMenuUser] = useState<UserResponse | null>(null)

  const queryKey = ['users', roleFilter, statusFilter, page, pageSize]
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      userApi.searchUsers({
        role: roleFilter || undefined,
        status: (statusFilter || undefined) as UserStatus | undefined,
        page,
        size: pageSize,
      }),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { firstName: '', lastName: '', email: '', roleName: 'Recruiter', phoneNumber: '' },
  })
  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { firstName: '', lastName: '', phoneNumber: '' },
  })

  const createMutation = useMutation({
    mutationFn: (values: CreateUserFormValues) =>
      userApi.createUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        roleName: values.roleName,
        phoneNumber: values.phoneNumber || undefined,
      }),
    onSuccess: () => {
      toast.success('User created. A temporary password was generated server-side.')
      setCreateOpen(false)
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create the user.'),
  })

  const editMutation = useMutation({
    mutationFn: (values: EditUserFormValues) =>
      userApi.updateUser(editUser!.userId, {
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber || undefined,
      }),
    onSuccess: () => {
      toast.success('User updated.')
      setEditUser(null)
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update the user.'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: UserStatus }) =>
      userApi.updateUserStatus(userId, { status }),
    onSuccess: (_r, vars) => {
      toast.success(`User set to ${vars.status}.`)
      closeMenu()
      invalidate()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not change status.'),
  })

  const openMenu = (e: MouseEvent<HTMLElement>, user: UserResponse) => {
    setMenuAnchor(e.currentTarget)
    setMenuUser(user)
  }
  const closeMenu = () => {
    setMenuAnchor(null)
    setMenuUser(null)
  }
  const openEdit = (user: UserResponse) => {
    editForm.reset({ firstName: user.firstName, lastName: user.lastName, phoneNumber: user.phoneNumber ?? '' })
    setEditUser(user)
    closeMenu()
  }

  const columns: DataTableColumn<UserResponse>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (u) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AppAvatar firstName={u.firstName} lastName={u.lastName} size={32} />
          <Typography variant="body2" fontWeight={600}>
            {u.firstName} {u.lastName}
          </Typography>
        </Stack>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'roles', header: 'Roles', render: (u) => u.roles.join(', ') || '—' },
    { key: 'userStatus', header: 'Status', render: (u) => <StatusChip status={u.userStatus} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <IconButton size="small" onClick={(e) => openMenu(e, u)} aria-label="User actions">
          <MoreVertRoundedIcon fontSize="small" />
        </IconButton>
      ),
    },
  ]

  const users = data?.content ?? []
  const hasFilters = Boolean(roleFilter || statusFilter || search)

  return (
    <>
      <PageHeader
        title="User Management"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.hrAdminDashboard }, { label: 'User Management' }]}
        actions={
          <AppButton
            variant="contained"
            startIcon={<PersonAddAltRoundedIcon />}
            onClick={() => {
              createForm.reset({ firstName: '', lastName: '', email: '', roleName: 'Recruiter', phoneNumber: '' })
              setCreateOpen(true)
            }}
          >
            Create User
          </AppButton>
        }
      />

      <SectionCard>
        <Stack spacing={2.5}>
          <SearchFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search users…"
            hasActiveFilters={hasFilters}
            onClearFilters={() => {
              setSearch('')
              setRoleFilter('')
              setStatusFilter('')
            }}
            filters={
              <>
                <TextField
                  select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value)
                    onPageChange(0)
                  }}
                  sx={{ minWidth: 170 }}
                  label="Role"
                >
                  <MenuItem value="">All roles</MenuItem>
                  {INTERNAL_ROLE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    onPageChange(0)
                  }}
                  sx={{ minWidth: 160 }}
                  label="Status"
                >
                  {STATUS_FILTERS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            }
          />

          <DataTable
            columns={columns}
            rows={users.filter((u) =>
              debouncedSearch
                ? `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(debouncedSearch.toLowerCase())
                : true,
            )}
            rowKey={(u) => u.userId}
            loading={isLoading}
            emptyTitle="No users found"
            emptyDescription="Create an internal user account to get started."
          />

          {data ? (
            <AppPagination
              page={data.number + 1}
              pageSize={data.size}
              totalRecords={data.totalElements}
              onPageChange={(p) => onPageChange(p - 1)}
            />
          ) : null}
        </Stack>
      </SectionCard>

      {/* Row actions menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuList dense sx={{ minWidth: 170 }}>
          <MenuItem onClick={() => menuUser && openEdit(menuUser)}>Edit</MenuItem>
          {menuUser?.userStatus !== 'Active' ? (
            <MenuItem onClick={() => menuUser && statusMutation.mutate({ userId: menuUser.userId, status: 'Active' })}>
              Activate
            </MenuItem>
          ) : null}
          {menuUser?.userStatus !== 'Inactive' ? (
            <MenuItem onClick={() => menuUser && statusMutation.mutate({ userId: menuUser.userId, status: 'Inactive' })}>
              Deactivate
            </MenuItem>
          ) : null}
          {menuUser?.userStatus !== 'Suspended' ? (
            <MenuItem
              sx={{ color: 'warning.main' }}
              onClick={() => menuUser && statusMutation.mutate({ userId: menuUser.userId, status: 'Suspended' })}
            >
              Suspend
            </MenuItem>
          ) : null}
        </MenuList>
      </Menu>

      {/* Create user dialog */}
      <AppDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Internal User"
        actions={
          <>
            <AppButton color="inherit" onClick={() => setCreateOpen(false)}>
              Cancel
            </AppButton>
            <AppButton
              variant="contained"
              loading={createMutation.isPending}
              onClick={createForm.handleSubmit((v) => createMutation.mutate(v))}
            >
              Create User
            </AppButton>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Grid container spacing={2}>
            <Grid size={6}>
              <FormTextField name="firstName" control={createForm.control} label="First name" />
            </Grid>
            <Grid size={6}>
              <FormTextField name="lastName" control={createForm.control} label="Last name" />
            </Grid>
          </Grid>
          <FormTextField name="email" control={createForm.control} label="Email" type="email" />
          <FormSelect name="roleName" control={createForm.control} label="Role" options={INTERNAL_ROLE_OPTIONS} />
          <FormTextField name="phoneNumber" control={createForm.control} label="Phone number (optional)" />
        </Stack>
      </AppDialog>

      {/* Edit user dialog */}
      {editUser ? (
        <AppDialog
          open={Boolean(editUser)}
          onClose={() => setEditUser(null)}
          title={`Edit ${editUser.firstName} ${editUser.lastName}`}
          actions={
            <>
              <AppButton color="inherit" onClick={() => setEditUser(null)}>
                Cancel
              </AppButton>
              <AppButton
                variant="contained"
                loading={editMutation.isPending}
                onClick={editForm.handleSubmit((v) => editMutation.mutate(v))}
              >
                Save
              </AppButton>
            </>
          }
        >
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <FormTextField name="firstName" control={editForm.control} label="First name" />
              </Grid>
              <Grid size={6}>
                <FormTextField name="lastName" control={editForm.control} label="Last name" />
              </Grid>
            </Grid>
            <FormTextField name="phoneNumber" control={editForm.control} label="Phone number" />
          </Stack>
        </AppDialog>
      ) : null}
    </>
  )
}
