import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, List, ListItem, MenuItem, Stack, TextField, Typography, alpha } from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { StatusChip } from '@/components/common/StatusChip'
import { notificationApi } from '@/api/notificationApi'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime } from '@/utils/formatters'
import { BRAND } from '@/theme/palette'
import type { NotificationChannel, NotificationHistoryItem } from '@/types/notification'

const CHANNEL_ICON: Record<NotificationChannel, typeof EmailOutlinedIcon> = {
  Email: EmailOutlinedIcon,
  SMS: SmsOutlinedIcon,
  InApp: NotificationsNoneOutlinedIcon,
}

const CHANNEL_FILTERS = [
  { value: '', label: 'All channels' },
  { value: 'Email', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'InApp', label: 'In-App' },
]

function humanizeEvent(event: string): string {
  return event.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
}

export default function NotificationCenterPage() {
  const { user } = useAuth()
  const [channel, setChannel] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['notificationCenter', user?.userId],
    queryFn: () => notificationApi.history({ recipientId: user?.userId ?? undefined, page: 1, size: 50 }),
  })

  const all = data?.data ?? []
  const rows = channel ? all.filter((n) => n.channel === channel) : all

  return (
    <>
      <PageHeader title="Notification Center" description="Your recruitment notifications and alerts." />

      <SectionCard
        title="Notifications"
        actions={
          <TextField select size="small" value={channel} onChange={(e) => setChannel(e.target.value)} sx={{ minWidth: 160 }}>
            {CHANNEL_FILTERS.map((f) => (
              <MenuItem key={f.value} value={f.value}>
                {f.label}
              </MenuItem>
            ))}
          </TextField>
        }
        noPadding
      >
        {isLoading ? (
          <Box sx={{ p: 2 }}>
            <TableSkeleton rows={5} columns={1} />
          </Box>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<NotificationsNoneOutlinedIcon fontSize="medium" />}
            title="You're all caught up"
            description="Notifications about your applications, interviews, and offers will appear here."
          />
        ) : (
          <List disablePadding>
            {rows.map((n: NotificationHistoryItem, i) => {
              const Icon = CHANNEL_ICON[n.channel] ?? NotificationsNoneOutlinedIcon
              return (
                <ListItem
                  key={n.notificationId}
                  divider={i < rows.length - 1}
                  sx={{ py: 1.75, px: 3, gap: 1.5, alignItems: 'flex-start' }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(BRAND.steel, 0.12),
                      color: BRAND.steel,
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                  <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.25}>
                    <Typography variant="body2" fontWeight={600}>
                      {humanizeEvent(n.event)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(n.sentAt)}
                    </Typography>
                  </Stack>
                  <StatusChip status={n.channel} />
                </ListItem>
              )
            })}
          </List>
        )}
      </SectionCard>
    </>
  )
}
