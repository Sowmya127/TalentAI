import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Chip, Grid, IconButton, Stack, TextField, Typography, alpha } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppButton } from '@/components/common/AppButton'
import { EmptyState } from '@/components/common/EmptyState'
import { CardSkeleton } from '@/components/common/LoadingSkeleton'
import { CandidateProfileGate } from '@/components/candidate/CandidateProfileGate'
import { candidateApi } from '@/api/candidateApi'
import { jobApi } from '@/api/jobApi'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import { BRAND } from '@/theme/palette'
import type { CandidateProfile } from '@/types/candidate'

const GREEN = '#16A34A'
const DEFAULT_SUGGESTED = ['React', 'Docker', 'REST APIs', 'TypeScript', 'AWS', 'Go', 'Kubernetes', 'SQL']

/** Best-effort display category for a skill row (cosmetic only — the backend
 * stores skills as plain names). Falls back to "Skill". */
const CATEGORY_RULES: { category: string; skills: string[] }[] = [
  { category: 'Programming', skills: ['python', 'java', 'javascript', 'typescript', 'go', 'golang', 'c++', 'c#', 'ruby', 'php', 'kotlin', 'swift', 'rust', 'scala'] },
  { category: 'Frontend', skills: ['react', 'angular', 'vue', 'css', 'html', 'tailwind', 'next.js', 'redux'] },
  { category: 'Engineering', skills: ['full stack development', 'system design', 'microservices', 'rest apis', 'graphql', 'devops', 'ci/cd'] },
  { category: 'Cloud', skills: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'] },
  { category: 'Data', skills: ['sql', 'mysql', 'postgresql', 'mongodb', 'data analysis', 'machine learning', 'pandas', 'spark'] },
]

function inferCategory(skill: string): string {
  const key = skill.trim().toLowerCase()
  const hit = CATEGORY_RULES.find((rule) => rule.skills.includes(key))
  return hit?.category ?? 'Skill'
}

function SkillsBody({ profile }: { profile: CandidateProfile }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [newSkill, setNewSkill] = useState('')

  const skillsQueryKey = ['candidateSkills', profile.candidateId]
  const { data, isLoading } = useQuery({
    queryKey: skillsQueryKey,
    queryFn: () => candidateApi.getSkills(profile.candidateId),
  })
  const jobsQuery = useQuery({
    queryKey: ['publishedJobsForSkills'],
    queryFn: () => jobApi.search({ status: 'Published', page: 1, size: 50 }),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (skills: string[]) => candidateApi.updateSkills(profile.candidateId, skills),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: skillsQueryKey }),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update your skills.'),
  })

  const skills = data?.skills ?? []
  const owned = new Set(skills.map((s) => s.toLowerCase()))

  // --- Demand from currently open roles (real data) ---
  const jobs = jobsQuery.data?.data ?? []
  const demandMap = new Map<string, { name: string; count: number }>()
  for (const job of jobs) {
    const seen = new Set<string>()
    for (const raw of [...(job.requiredSkills ?? []), ...(job.preferredSkills ?? [])]) {
      const name = raw.trim()
      if (!name) continue
      const key = name.toLowerCase()
      if (seen.has(key)) continue // count each skill once per job
      seen.add(key)
      const cur = demandMap.get(key)
      if (cur) cur.count += 1
      else demandMap.set(key, { name, count: 1 })
    }
  }
  const missingInDemand = [...demandMap.values()]
    .filter((d) => !owned.has(d.name.toLowerCase()))
    .sort((a, b) => b.count - a.count)

  const suggested =
    missingInDemand.length > 0
      ? missingInDemand.slice(0, 6).map((d) => d.name)
      : DEFAULT_SUGGESTED.filter((s) => !owned.has(s.toLowerCase())).slice(0, 6)

  const inDemand = missingInDemand.slice(0, 5)
  const maxDemand = inDemand.length > 0 ? inDemand[0].count : 1

  const insightSkills = missingInDemand.slice(0, 2).map((d) => d.name)
  const insightKeys = new Set(insightSkills.map((s) => s.toLowerCase()))
  const rolesMatched = jobs.filter((job) =>
    [...(job.requiredSkills ?? []), ...(job.preferredSkills ?? [])].some((s) => insightKeys.has(s.trim().toLowerCase())),
  ).length
  const showInsight = insightSkills.length > 0 && rolesMatched > 0

  const addSkills = (toAdd: string[]) => {
    const set = new Set(skills.map((s) => s.toLowerCase()))
    const merged = [...skills]
    for (const s of toAdd) {
      const t = s.trim()
      if (t && !set.has(t.toLowerCase())) {
        merged.push(t)
        set.add(t.toLowerCase())
      }
    }
    if (merged.length !== skills.length) mutate(merged)
  }

  const addTyped = () => {
    addSkills([newSkill])
    setNewSkill('')
  }

  const removeSkill = (skill: string) => mutate(skills.filter((s) => s !== skill))

  return (
    <>
      <PageHeader
        title="Skills"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.candidateDashboard }, { label: 'Skills' }]}
      />

      <Grid container spacing={2.5}>
        {/* Left column */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2.5}>
            <SectionCard title="Add a skill">
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    placeholder="e.g. Java, React, Project Management"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTyped()
                      }
                    }}
                    fullWidth
                  />
                  <AppButton
                    variant="contained"
                    color="secondary"
                    startIcon={<AddRoundedIcon />}
                    onClick={addTyped}
                    loading={isPending}
                    disabled={!newSkill.trim()}
                  >
                    Add
                  </AppButton>
                </Stack>
                {suggested.length > 0 ? (
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="caption" color="text.secondary">
                      Suggested:
                    </Typography>
                    {suggested.map((s) => (
                      <Chip
                        key={s}
                        label={`+ ${s}`}
                        size="small"
                        variant="outlined"
                        clickable
                        onClick={() => addSkills([s])}
                        disabled={isPending}
                      />
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            </SectionCard>

            <SectionCard
              title="Your skill set"
              actions={
                <Typography variant="body2" color="text.secondary">
                  {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
                </Typography>
              }
            >
              {isLoading ? (
                <CardSkeleton height={80} />
              ) : skills.length === 0 ? (
                <EmptyState
                  title="No skills added yet"
                  description="Add skills manually, tap a suggestion above, or parse your resume to extract them automatically."
                />
              ) : (
                <Stack spacing={1.25}>
                  {skills.map((skill) => (
                    <Box
                      key={skill}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        px: 2,
                        py: 1.5,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {skill}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {inferCategory(skill)}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        aria-label={`Remove ${skill}`}
                        onClick={() => removeSkill(skill)}
                        disabled={isPending}
                      >
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </SectionCard>
          </Stack>
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2.5}>
            {showInsight ? (
              <Box sx={{ bgcolor: BRAND.charcoal, color: '#FFFFFF', borderRadius: 3, p: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                  <AutoAwesomeRoundedIcon sx={{ color: BRAND.taupe, fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ color: alpha('#FFFFFF', 0.9) }}>
                    AI Insight
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.8) }}>
                  Adding{' '}
                  <Box component="span" sx={{ color: BRAND.taupe, fontWeight: 700 }}>
                    {insightSkills.join(' and ')}
                  </Box>{' '}
                  would match you with {rolesMatched} more open role{rolesMatched === 1 ? '' : 's'} this week.
                </Typography>
                <AppButton
                  variant="contained"
                  color="secondary"
                  fullWidth
                  sx={{ mt: 2 }}
                  endIcon={<ArrowOutwardRoundedIcon />}
                  loading={isPending}
                  onClick={() => addSkills(insightSkills)}
                >
                  Improve my profile
                </AppButton>
              </Box>
            ) : null}

            {inDemand.length > 0 ? (
              <SectionCard>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <TrendingUpRoundedIcon fontSize="small" sx={{ color: BRAND.slate }} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    In demand near you
                  </Typography>
                </Stack>
                <Stack spacing={1.75}>
                  {inDemand.map((d) => (
                    <Box key={d.name}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight={600}>
                          {d.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {d.count} {d.count === 1 ? 'role' : 'roles'}
                        </Typography>
                      </Stack>
                      <Box sx={{ mt: 0.75, height: 6, borderRadius: 3, bgcolor: alpha(GREEN, 0.15) }}>
                        <Box
                          sx={{
                            width: `${Math.max(8, (d.count / maxDemand) * 100)}%`,
                            height: '100%',
                            borderRadius: 3,
                            bgcolor: GREEN,
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </SectionCard>
            ) : null}

            <Box sx={{ bgcolor: alpha(BRAND.taupe, 0.15), borderRadius: 3, p: 2.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <VerifiedOutlinedIcon fontSize="small" sx={{ color: BRAND.steelDark }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Verify your skills
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Take a short assessment to earn a verified badge recruiters trust.
              </Typography>
              <AppButton
                variant="contained"
                fullWidth
                sx={{ mt: 2, bgcolor: BRAND.charcoal, '&:hover': { bgcolor: '#0B1526' } }}
                endIcon={<ArrowOutwardRoundedIcon />}
                onClick={() => toast.info('Skill assessments are coming soon.')}
              >
                Start assessment
              </AppButton>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </>
  )
}

export default function SkillsPage() {
  return <CandidateProfileGate>{(profile) => <SkillsBody profile={profile} />}</CandidateProfileGate>
}
