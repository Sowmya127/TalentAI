import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Chip, Grid, Stack, Typography } from '@mui/material'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { MatchScore } from '@/components/common/MatchScore'
import { AppAvatar } from '@/components/common/AppAvatar'
import { StatusChip } from '@/components/common/StatusChip'
import { AiInsightCard } from '@/components/common/AiInsightCard'
import { EmptyState } from '@/components/common/EmptyState'
import { aiMatchApi } from '@/api/aiMatchApi'
import { jobApi } from '@/api/jobApi'
import { buildPath, ROUTES } from '@/constants/routes'
import type { RankedCandidate } from '@/types/aiMatch'

export default function AiMatchResultsPage() {
  const navigate = useNavigate()
  const { jobId } = useParams<{ jobId: string }>()
  const numericJobId = Number(jobId)

  const { data: job } = useQuery({
    queryKey: ['job', numericJobId],
    queryFn: () => jobApi.getJob(numericJobId),
    enabled: Number.isFinite(numericJobId),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['aiRanking', numericJobId],
    queryFn: () => aiMatchApi.ranking(numericJobId, { sortBy: 'matchScore', page: 1, size: 20 }),
    enabled: Number.isFinite(numericJobId),
  })

  const rows = data?.data ?? []
  const topMatch = rows[0]

  // Full match for the top candidate — carries the Bedrock narrative (aiInsight /
  // strengths / concerns) when AI matching is enabled; falls back to the
  // deterministic summary below when those fields are absent.
  const { data: topInsight } = useQuery({
    queryKey: ['aiMatch', numericJobId, topMatch?.candidateId],
    queryFn: () => aiMatchApi.match({ candidateId: topMatch!.candidateId, jobId: numericJobId }),
    enabled: Number.isFinite(numericJobId) && !!topMatch,
  })

  const columns: DataTableColumn<RankedCandidate>[] = [
    {
      key: 'name',
      header: 'Candidate',
      render: (r) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AppAvatar firstName={r.name} size={32} />
          <Typography variant="body2" fontWeight={600}>
            {r.name}
          </Typography>
        </Stack>
      ),
    },
    { key: 'matchScore', header: 'Match Score', width: 180, render: (r) => <MatchScore score={r.matchScore} showBar /> },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
  ]

  return (
    <>
      <PageHeader
        title="AI Match Results"
        description={job?.title}
        breadcrumbs={[
          { label: 'Dashboard', to: ROUTES.recruiterDashboard },
          { label: 'Jobs', to: ROUTES.recruiterJobs },
          { label: 'AI Match Results' },
        ]}
      />

      <Grid container spacing={2.5}>
        <Grid size={12}>
          <AiInsightCard title="AI Ranking Summary">
            <Typography variant="body2" color="text.primary">
              {topMatch
                ? `${rows.length} candidates ranked by fit. Top match: ${topMatch.name} at ${topMatch.matchScore}%. Scores weigh required skills, experience, and qualifications — always review the breakdown before deciding.`
                : 'No ranked candidates yet. Rankings appear once candidates apply and AI matching runs.'}
            </Typography>

            {topInsight?.aiInsight ? (
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                <Typography variant="body2" color="text.primary">
                  <strong>{topMatch?.name}:</strong> {topInsight.aiInsight}
                </Typography>
                {topInsight.strengths?.length ? (
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      STRENGTHS
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                      {topInsight.strengths.map((s) => (
                        <Chip key={s} label={s} size="small" color="success" variant="outlined" />
                      ))}
                    </Stack>
                  </Stack>
                ) : null}
                {topInsight.concerns?.length ? (
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      CONCERNS
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                      {topInsight.concerns.map((c) => (
                        <Chip key={c} label={c} size="small" color="warning" variant="outlined" />
                      ))}
                    </Stack>
                  </Stack>
                ) : null}
              </Stack>
            ) : null}
          </AiInsightCard>
        </Grid>

        <Grid size={12}>
          <SectionCard title="Ranked Candidates" noPadding>
            {!isLoading && rows.length === 0 ? (
              <EmptyState
                icon={<AutoAwesomeRoundedIcon fontSize="medium" />}
                title="No matches yet"
                description="Once candidates apply, AI-ranked matches will appear here."
              />
            ) : (
              <DataTable
                columns={columns}
                rows={rows}
                rowKey={(r) => r.candidateId}
                loading={isLoading}
                onRowClick={(r) => navigate(buildPath(ROUTES.recruiterCandidateDetails, { candidateId: r.candidateId }))}
              />
            )}
          </SectionCard>
        </Grid>

        {job ? (
          <Grid size={12}>
            <SectionCard title="Role Requirements">
              <Stack spacing={1.5}>
                <Stack spacing={0.75}>
                  <Typography variant="caption" color="text.secondary">
                    REQUIRED SKILLS
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                    {job.requiredSkills.map((s) => (
                      <Chip key={s} label={s} size="small" color="primary" />
                    ))}
                  </Stack>
                </Stack>
                {job.preferredSkills?.length ? (
                  <Stack spacing={0.75}>
                    <Typography variant="caption" color="text.secondary">
                      PREFERRED SKILLS
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                      {job.preferredSkills.map((s) => (
                        <Chip key={s} label={s} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Stack>
                ) : null}
              </Stack>
            </SectionCard>
          </Grid>
        ) : null}
      </Grid>
    </>
  )
}
