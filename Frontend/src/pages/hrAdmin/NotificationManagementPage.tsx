import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stack } from '@mui/material'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusChip } from '@/components/common/StatusChip'
import { AppButton } from '@/components/common/AppButton'
import { AppDialog } from '@/components/common/AppDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { FormTextField } from '@/components/form/FormTextField'
import { FormSelect } from '@/components/form/FormSelect'
import { notificationApi } from '@/api/notificationApi'
import { useToast } from '@/hooks/useToast'
import { formatDateTime } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'
import { triggerNotificationSchema, type TriggerNotificationFormValues } from './schemas'
import type { NotificationChannel, NotificationHistoryItem } from '@/types/notification'

const CHANNELS = [
  { value: 'Email', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'InApp', label: 'In-App' },
]

export default function NotificationManagementPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.history({ page: 1, size: 20 }),
  })

  const { control, handleSubmit, reset } = useForm<TriggerNotificationFormValues>({
    resolver: zodResolver(triggerNotificationSchema),
    defaultValues: { channel: 'Email', recipientId: '', template: '', event: '' },
  })

  const triggerMutation = useMutation({
    mutationFn: (values: TriggerNotificationFormValues) =>
      notificationApi.trigger({
        channel: values.channel as NotificationChannel,
        recipientId: Number(values.recipientId),
        template: values.template,
        event: values.event,
      }),
    onSuccess: () => {
      toast.success('Notification triggered.')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not trigger notification.'),
  })

  const columns: DataTableColumn<NotificationHistoryItem>[] = [
    { key: 'notificationId', header: 'ID', width: 80 },
    { key: 'channel', header: 'Channel', render: (n) => <StatusChip status={n.channel} /> },
    { key: 'event', header: 'Event' },
    { key: 'recipientId', header: 'Recipient', render: (n) => (n.recipientId != null ? `#${n.recipientId}` : '—') },
    { key: 'sentAt', header: 'Sent', render: (n) => formatDateTime(n.sentAt) },
  ]

  const rows = data?.data ?? []

  return (
    <>
      <PageHeader
        title="Notification Management"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.hrAdminDashboard }, { label: 'Notification Management' }]}
        actions={
          <AppButton
            variant="contained"
            startIcon={<SendRoundedIcon />}
            onClick={() => {
              reset({ channel: 'Email', recipientId: '', template: '', event: '' })
              setOpen(true)
            }}
          >
            Trigger Notification
          </AppButton>
        }
      />

      <SectionCard title="Notification History" noPadding>
        {!isLoading && rows.length === 0 ? (
          <EmptyState
            icon={<NotificationsActiveOutlinedIcon fontSize="medium" />}
            title="No notifications yet"
            description="Notifications triggered by recruitment events will appear here."
          />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(n) => n.notificationId} loading={isLoading} />
        )}
      </SectionCard>

      <AppDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Trigger Notification"
        actions={
          <>
            <AppButton color="inherit" onClick={() => setOpen(false)}>
              Cancel
            </AppButton>
            <AppButton variant="contained" loading={triggerMutation.isPending} onClick={handleSubmit((v) => triggerMutation.mutate(v))}>
              Send
            </AppButton>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <FormSelect name="channel" control={control} label="Channel" options={CHANNELS} />
          <FormTextField name="recipientId" control={control} label="Recipient ID" type="number" />
          <FormTextField name="template" control={control} label="Template" helperText="e.g. APPLICATION_CONFIRMATION" />
          <FormTextField name="event" control={control} label="Event" helperText="e.g. CandidateApplied" />
        </Stack>
      </AppDialog>
    </>
  )
}
