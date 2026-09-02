import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Chip, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchFilterBar } from '@/components/common/SearchFilterBar'
import { AppPagination } from '@/components/common/AppPagination'
import { EmptyState } from '@/components/common/EmptyState'
import { CardSkeleton } from '@/components/common/LoadingSkeleton'
import { AppButton } from '@/components/common/AppButton'
import { jobApi } from '@/api/jobApi'
import { useDebounce } from '@/hooks/useDebounce'
import { buildPath, ROUTES } from '@/constants/routes'

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Any experience' },
  { value: '0', label: 'Entry level' },
  { value: '2', label: '2+ years' },
  { value: '5', label: '5+ years' },
  { value: '8', label: '8+ years' },
]

export default function JobSearchPage() {
  const navigate = useNavigate()
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState('')
  const [experience, setExperience] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 9

  const debouncedLocation = useDebounce(location)
  const debouncedSkills = useDebounce(skills)

  const { data, isLoading } = useQuery({
    queryKey: ['jobSearch', debouncedLocation, debouncedSkills, experience, page],
    queryFn: () =>
      jobApi.search({
        status: 'Published',
        location: debouncedLocation || undefined,
        skills: debouncedSkills || undefined,
        experience: experience ? Number(experience) : undefined,
        page,
        size: pageSize,
      }),
  })

  const jobs = data?.data ?? []
  const hasFilters = Boolean(location || skills || experience)
  const clearFilters = () => {
    setLocation('')
    setSkills('')
    setExperience('')
    setPage(1)
  }

  return (
    <>
      <PageHeader
        title="Search Jobs"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.candidateDashboard }, { label: 'Search Jobs' }]}
      />

      <Stack spacing={3}>
        <SearchFilterBar
          searchValue={skills}
          onSearchChange={(v) => {
            setSkills(v)
            setPage(1)
          }}
          searchPlaceholder="Search by skill, e.g. Java, React…"
          hasActiveFilters={hasFilters}
          onClearFilters={clearFilters}
          filters={
            <>
              <TextField
                placeholder="Location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  setPage(1)
                }}
                sx={{ minWidth: 180 }}
                slotProps={{ input: { startAdornment: <PlaceOutlinedIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> } }}
              />
              <TextField
                select
                value={experience}
                onChange={(e) => {
                  setExperience(e.target.value)
                  setPage(1)
                }}
                sx={{ minWidth: 180 }}
              >
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </>
          }
        />

        {isLoading ? (
          <Grid container spacing={2.5}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <CardSkeleton height={150} />
              </Grid>
            ))}
          </Grid>
        ) : jobs.length === 0 ? (
          <Card>
            <EmptyState
              icon={<SearchOffRoundedIcon fontSize="medium" />}
              title="No matching jobs found"
              description="Try broadening your search filters."
            />
          </Card>
        ) : (
          <>
            <Grid container spacing={2.5}>
              {jobs.map((job) => (
                <Grid key={job.jobId} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {job.title}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5} color="text.secondary">
                        <PlaceOutlinedIcon fontSize="inherit" />
                        <Typography variant="body2" color="text.secondary">
                          {job.location}
                          {job.department ? ` · ${job.department}` : ''}
                        </Typography>
                      </Stack>
                      {job.employmentType ? (
                        <Stack direction="row" alignItems="center" spacing={0.5} color="text.secondary">
                          <WorkOutlineIcon fontSize="inherit" />
                          <Typography variant="body2" color="text.secondary">
                            {job.employmentType}
                          </Typography>
                        </Stack>
                      ) : null}
                    </Stack>
                    {job.requiredSkills?.length ? (
                      <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.75}>
                        {job.requiredSkills.slice(0, 4).map((skill) => (
                          <Chip key={skill} label={skill} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    ) : null}
                    <AppButton
                      variant="outlined"
                      sx={{ mt: 'auto', alignSelf: 'flex-start' }}
                      onClick={() => navigate(buildPath(ROUTES.candidateJobDetails, { jobId: job.jobId }))}
                    >
                      View Details
                    </AppButton>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <AppPagination
              page={page}
              pageSize={pageSize}
              totalRecords={data?.totalRecords ?? jobs.length}
              onPageChange={setPage}
            />
          </>
        )}
      </Stack>
    </>
  )
}
