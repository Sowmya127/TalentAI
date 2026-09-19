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

// In-page sections (replaces the old placeholder nav links).
const NAV_LINKS = [
  { label: 'What is TalentAI', href: '#what' },
  { label: 'How it’s designed', href: '#how' },
  { label: 'About', href: '#about' },
]

// What the platform actually does — grounded in the implemented modules.
const WHAT_POINTS = [
  { title: 'Self-registration & approval', body: 'Candidates join instantly; recruiters, hiring managers, interviewers and HR request access and are approved by an administrator.' },
  { title: 'Jobs & applications', body: 'Create and publish roles, then manage every application through a clear, staged pipeline.' },
  { title: 'Interviews & feedback', body: 'Schedule interviews and capture structured, per-competency interviewer feedback.' },
  { title: 'Offers & decisions', body: 'Generate offers, route them for approval, and record the final hiring decision.' },
]

// How it is built — grounded in the actual architecture.
const DESIGN_POINTS = [
  { title: 'Role-based by design', body: 'Six roles — Candidate, Recruiter, Hiring Manager, Interviewer, HR and Administrator — each see only what they need, enforced on the server.' },
  { title: 'Secure by default', body: 'Stateless JWT authentication, BCrypt password hashing, and server-side validation on every request.' },
  { title: 'Modular architecture', body: 'A React + Material UI frontend and a Spring Boot + MySQL backend, organised into independent domain modules.' },
  { title: 'Workflow-driven', body: 'Registration approvals, in-app notifications, and audit trails are built into the core.' },
]

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
                  key={link.href}
                  component="a"
                  href={link.href}
                  variant="body2"
                  sx={{ color: alpha(NAVY, 0.75), textDecoration: 'none', '&:hover': { color: NAVY } }}
                >
                  {link.label}
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
                Register
              </AppButton>
            </Stack>

            {/* Real, verifiable facts — no invented vanity metrics. The role count
                is live from the API; the rest reflect the actual platform. */}
            <Stack direction="row" spacing={3} sx={{ mt: 4 }} flexWrap="wrap" useFlexGap>
              {[
                { dot: AMBER, label: jobsQuery.isLoading ? 'Live roles updating…' : `${openCount} open role${openCount === 1 ? '' : 's'}` },
                { dot: '#9BD1B6', label: 'Full hiring lifecycle' },
                { dot: '#F4B7B7', label: 'Role-based access' },
              ].map((s) => (
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

      {/* ── What is TalentAI ───────────────────────────────────────── */}
      <Box id="what" sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Typography variant="overline" sx={{ color: AMBER, fontWeight: 700, letterSpacing: '0.12em' }}>
            What is {env.appName}
          </Typography>
          <Typography
            component="h2"
            sx={{ fontFamily: SERIF, fontWeight: 700, color: NAVY, mt: 1, mb: 2,
                  fontSize: { xs: '1.8rem', md: '2.4rem' }, letterSpacing: '-0.01em' }}
          >
            One place for the whole hiring journey.
          </Typography>
          <Typography variant="body1" sx={{ color: alpha(NAVY, 0.72), maxWidth: 720, mb: 4 }}>
            {env.appName} is a recruitment platform that runs the entire hiring process end to end — from a
            candidate creating a profile to a team making an offer — without spreadsheets or scattered tools.
            Everyone works in the same system, each seeing only the part of the process that belongs to them.
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            {WHAT_POINTS.map((p) => (
              <Box
                key={p.title}
                sx={{ bgcolor: '#FFFFFF', border: `1px solid ${alpha(NAVY, 0.1)}`, borderRadius: 2, p: 2.5 }}
              >
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: NAVY, mb: 0.5 }}>
                  {p.title}
                </Typography>
                <Typography variant="body2" sx={{ color: alpha(NAVY, 0.7) }}>
                  {p.body}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── How TalentAI is designed ───────────────────────────────── */}
      <Box id="how" sx={{ bgcolor: NAVY, color: '#FFFFFF', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Typography variant="overline" sx={{ color: AMBER, fontWeight: 700, letterSpacing: '0.12em' }}>
            How it’s designed
          </Typography>
          <Typography
            component="h2"
            sx={{ fontFamily: SERIF, fontWeight: 700, mt: 1, mb: 2,
                  fontSize: { xs: '1.8rem', md: '2.4rem' }, letterSpacing: '-0.01em' }}
          >
            Built to be secure, modular and role-aware.
          </Typography>
          <Typography variant="body1" sx={{ color: alpha('#FFFFFF', 0.75), maxWidth: 720, mb: 4 }}>
            {env.appName} is engineered like a production recruitment system: a clear separation between what each
            role can do, security enforced on the server, and a codebase split into independent modules that can
            grow without getting in each other’s way.
          </Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            {DESIGN_POINTS.map((p) => (
              <Box
                key={p.title}
                sx={{ bgcolor: alpha('#FFFFFF', 0.05), border: `1px solid ${alpha('#FFFFFF', 0.12)}`,
                      borderRadius: 2, p: 2.5 }}
              >
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                  {p.title}
                </Typography>
                <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.7) }}>
                  {p.body}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── About ──────────────────────────────────────────────────── */}
      <Box id="about" sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <Typography variant="overline" sx={{ color: AMBER, fontWeight: 700, letterSpacing: '0.12em' }}>
            About
          </Typography>
          <Typography
            component="h2"
            sx={{ fontFamily: SERIF, fontWeight: 700, color: NAVY, mt: 1, mb: 2,
                  fontSize: { xs: '1.8rem', md: '2.4rem' }, letterSpacing: '-0.01em' }}
          >
            About {env.appName}
          </Typography>
          <Typography variant="body1" sx={{ color: alpha(NAVY, 0.72), mb: 2 }}>
            {env.appName} was built to show what a modern, enterprise-style recruitment platform looks like when the
            whole hiring lifecycle lives in one connected system. Its purpose is simple: make hiring transparent and
            fast for everyone involved — candidates, recruiters, hiring managers, interviewers and HR — while keeping
            data secure and access strictly scoped to each person’s role.
          </Typography>
          <Typography variant="body1" sx={{ color: alpha(NAVY, 0.72) }}>
            The platform brings together candidate profiles and résumés, job posting and applications, interview
            scheduling and feedback, offers and approvals, notifications, and reporting — each as a first-class part
            of the product rather than an afterthought.
          </Typography>
        </Container>
      </Box>

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
