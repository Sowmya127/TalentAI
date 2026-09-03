import { Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, Chip, CircularProgress, Container, Divider, Stack, Typography, alpha } from '@mui/material'
import WorkspacesRoundedIcon from '@mui/icons-material/WorkspacesRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { AppButton } from '@/components/common/AppButton'
import { jobApi } from '@/api/jobApi'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultRouteForRoles } from '@/constants/navigation'
import { ROUTES } from '@/constants/routes'
import { env } from '@/config/env'

const SERIF = "'Georgia', 'Times New Roman', serif"
const NAVY = '#14213D'
const AMBER = '#FCA311'

const STATS = [
  { dot: AMBER, label: '380+ teams' },
  { dot: '#F4B7B7', label: '12k placed' },
  { dot: '#9BD1B6', label: '4.8 avg rating' },
]

const NAV_LINKS = ['Roles', 'Companies', 'How it works']

export default function LandingPage() {
  const { isAuthenticated, roleKeys } = useAuth()
  const jobsQuery = useQuery({
    queryKey: ['publicPublishedJobs'],
    queryFn: () => jobApi.publicPublished({ page: 1, size: 3 }),
  })
  // Show at most 3 roles for a clean card; the count reflects ALL live roles.
  const liveJobs = (jobsQuery.data?.data ?? []).slice(0, 3)
  const openCount = jobsQuery.data?.totalRecords ?? 0

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FDF6EC', color: NAVY }}>
      {/* ── Top navigation ─────────────────────────────────────────── */}
      <Box component="header" sx={{ borderBottom: `1px solid ${alpha(NAVY, 0.08)}` }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 30, height: 30, borderRadius: '50%', bgcolor: AMBER,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAVY,
                }}
              >
                <WorkspacesRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ fontFamily: SERIF }}>
                {env.appName}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={4} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {NAV_LINKS.map((link) => (
                <Typography
                  key={link}
                  component="a"
                  href="#"
                  variant="body2"
                  sx={{ color: alpha(NAVY, 0.75), textDecoration: 'none', '&:hover': { color: NAVY } }}
                >
                  {link}
                </Typography>
              ))}
            </Stack>

            <AppButton
              component={RouterLink}
              to={isAuthenticated ? getDefaultRouteForRoles(roleKeys) : ROUTES.login}
              variant="contained"
              size="small"
              sx={{ bgcolor: NAVY, borderRadius: 5, px: 2.5, '&:hover': { bgcolor: '#0B1526' } }}
            >
              {isAuthenticated ? 'Dashboard' : 'Sign in'}
            </AppButton>
          </Stack>
        </Container>
      </Box>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 9 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 5, md: 6 }} alignItems="flex-start">
          {/* Left column */}
          <Box sx={{ flex: 1.1, minWidth: 0 }}>
            <Chip
              label={
                jobsQuery.isLoading
                  ? '● Live roles updating…'
                  : `● ${openCount} role${openCount === 1 ? '' : 's'} open right now`
              }
              size="small"
              sx={{
                bgcolor: alpha('#9BD1B6', 0.35), color: '#1F6B47', fontWeight: 600, mb: 3,
                '& .MuiChip-label': { px: 1.5 },
              }}
            />
            <Typography
              component="h1"
              sx={{ fontFamily: SERIF, fontWeight: 700, lineHeight: 1.1, color: NAVY,
                    fontSize: { xs: '2.6rem', sm: '3.4rem', md: '4rem' }, letterSpacing: '-0.02em' }}
            >
              The right person, found before the coffee gets cold.
            </Typography>
            <Typography variant="body1" sx={{ color: alpha(NAVY, 0.7), mt: 3, maxWidth: 460 }}>
              {env.appName} matches candidates and teams the way a good marketplace should — fast, human,
              and without the noise.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
              <AppButton
                component={RouterLink}
                to={ROUTES.login}
                variant="contained"
                color="secondary"
                size="large"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ borderRadius: 6, px: 3 }}
              >
                Sign in
              </AppButton>
              <AppButton
                component={RouterLink}
                to={ROUTES.register}
                variant="outlined"
                size="large"
                sx={{ borderRadius: 6, px: 3, borderColor: alpha(NAVY, 0.25), color: NAVY }}
              >
                Register as a candidate
              </AppButton>
            </Stack>

            <Stack direction="row" spacing={3} sx={{ mt: 4 }} flexWrap="wrap" useFlexGap>
              {STATS.map((s) => (
                <Stack key={s.label} direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.dot }} />
                  <Typography variant="body2" sx={{ color: alpha(NAVY, 0.7) }}>
                    {s.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Right column — Live Now card (dark navy) */}
          <Box
            sx={{
              flex: 0.9, width: '100%', bgcolor: NAVY, borderRadius: 3, p: 3, color: '#FFFFFF',
              boxShadow: '0 24px 48px -24px rgba(20,33,61,0.5)',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: SERIF }}>
                Live Now
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4ADE80' }} />
                <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.7) }}>
                  {openCount} open
                </Typography>
              </Stack>
            </Stack>

            {jobsQuery.isLoading ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress size={22} sx={{ color: alpha('#FFFFFF', 0.6) }} />
              </Stack>
            ) : liveJobs.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.6) }}>
                  No open roles right now — check back soon.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {liveJobs.map((job) => {
                  const org = [job.department, job.location].filter(Boolean).join(' · ')
                  const tags = job.requiredSkills?.slice(0, 3) ?? []
                  return (
                    <Box
                      key={job.jobId}
                      sx={{
                        bgcolor: alpha('#FFFFFF', 0.05), border: `1px solid ${alpha('#FFFFFF', 0.08)}`,
                        borderRadius: 2, p: 1.75,
                      }}
                    >
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {job.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.6) }}>
                            {org || 'Open role'}
                          </Typography>
                        </Box>
                        {job.employmentType ? (
                          <Chip
                            label={job.employmentType}
                            size="small"
                            sx={{ bgcolor: alpha(AMBER, 0.2), color: AMBER, fontWeight: 600, height: 22 }}
                          />
                        ) : null}
                      </Stack>
                      {tags.length > 0 ? (
                        <Stack direction="row" spacing={0.75} sx={{ mt: 1.25 }} flexWrap="wrap" useFlexGap>
                          {tags.map((t) => (
                            <Chip
                              key={t}
                              label={t}
                              size="small"
                              sx={{ bgcolor: alpha('#FFFFFF', 0.08), color: alpha('#FFFFFF', 0.85), height: 22 }}
                            />
                          ))}
                        </Stack>
                      ) : null}
                    </Box>
                  )
                })}
              </Stack>
            )}

            <Divider sx={{ borderColor: alpha('#FFFFFF', 0.1), my: 2 }} />
            <Typography
              component={RouterLink}
              to={ROUTES.login}
              variant="body2"
              sx={{ color: AMBER, textDecoration: 'none', fontWeight: 600, display: 'block', textAlign: 'center' }}
            >
              See all roles ↓
            </Typography>
          </Box>
        </Stack>
      </Container>

      {/* ── Browse by craft strip ──────────────────────────────────── */}
      <Box sx={{ bgcolor: alpha('#9BD1B6', 0.2), py: 5 }}>
        <Container maxWidth="lg">
          <Typography variant="h5" fontWeight={700} sx={{ fontFamily: SERIF, mb: 2.5 }}>
            Browse by craft
          </Typography>
          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
            {['Engineering', 'Design', 'Product', 'Marketing', 'Data', 'Operations', 'Sales', 'Finance'].map((c) => (
              <Chip
                key={c}
                label={c}
                component={RouterLink}
                to={ROUTES.login}
                clickable
                sx={{ bgcolor: '#FFFFFF', border: `1px solid ${alpha(NAVY, 0.12)}`, fontWeight: 500 }}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="caption" sx={{ color: alpha(NAVY, 0.55) }}>
          © {new Date().getFullYear()} {env.appName}. All rights reserved.
        </Typography>
      </Container>
    </Box>
  )
}
