import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { StatCard } from '@/components/common/StatCard'
import { CardSkeleton } from '@/components/common/LoadingSkeleton'
import { dashboardApi } from '@/api/dashboardApi'
import { ROUTES } from '@/constants/routes'

const DEPARTMENTS = [
  { value: '', label: 'All departments' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Analytics', label: 'Analytics' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Design', label: 'Design' },
]

const PERIODS = [
  { value: '', label: 'All time' },
  { value: 'Q1-2026', label: 'Q1 2026' },
  { value: 'Q2-2026', label: 'Q2 2026' },
  { value: 'Q3-2026', label: 'Q3 2026' },
]

export default function TimeToHirePage() {
  const [department, setDepartment] = useState('')
  const [period, setPeriod] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['timeToHire', department, period],
    queryFn: () => dashboardApi.timeToHire({ department: department || undefined, period: period || undefined }),
  })

  return (
    <>
      <PageHeader
        title="Time to Hire"
        breadcrumbs={[{ label: 'Reports', to: ROUTES.reportsDashboard }, { label: 'Time to Hire' }]}
      />

      <SectionCard>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField select label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} sx={{ minWidth: 200 }}>
              {DEPARTMENTS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} sx={{ minWidth: 180 }}>
              {PERIODS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {isLoading ? (
            <CardSkeleton height={120} />
          ) : (
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <StatCard
                  label={`Avg Time to Hire${data?.department ? ` · ${data.department}` : ''}`}
                  value={data ? `${data.avgTimeToHireDays} days` : '—'}
                  icon={<AccessTimeRoundedIcon />}
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack justifyContent="center" sx={{ height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    Average number of days taken to hire a candidate for the selected department and period.
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          )}
        </Stack>
      </SectionCard>
    </>
  )
}
