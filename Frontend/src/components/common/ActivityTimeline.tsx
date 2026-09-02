import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab'
import { Typography } from '@mui/material'
import { formatDateTime } from '@/utils/formatters'

export interface ActivityEvent {
  label: string
  timestamp?: string | null
  /** Semantic tone for the dot; falls back to a neutral slate. */
  tone?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'grey'
  done?: boolean
}

const DOT_COLOR: Record<NonNullable<ActivityEvent['tone']>, 'primary' | 'success' | 'warning' | 'error' | 'info' | 'grey'> = {
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
  grey: 'grey',
}

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  return (
    <Timeline
      sx={{
        m: 0,
        p: 0,
        '& .MuiTimelineItem-root:before': { flex: 0, padding: 0 },
      }}
    >
      {events.map((event, index) => {
        const isLast = index === events.length - 1
        const pending = event.done === false
        return (
          <TimelineItem key={`${event.label}-${index}`}>
            <TimelineSeparator>
              <TimelineDot
                variant={pending ? 'outlined' : 'filled'}
                color={DOT_COLOR[event.tone ?? 'grey']}
                sx={{ my: 0.5 }}
              />
              {!isLast ? <TimelineConnector /> : null}
            </TimelineSeparator>
            <TimelineContent sx={{ py: 0.5, pr: 0 }}>
              <Typography variant="body2" fontWeight={600} color={pending ? 'text.secondary' : 'text.primary'}>
                {event.label}
              </Typography>
              {event.timestamp ? (
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(event.timestamp)}
                </Typography>
              ) : pending ? (
                <Typography variant="caption" color="text.disabled">
                  Pending
                </Typography>
              ) : null}
            </TimelineContent>
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}
