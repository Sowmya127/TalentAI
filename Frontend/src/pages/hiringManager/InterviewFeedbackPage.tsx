import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Chip, Divider, Grid, Rating, Stack, Typography } from '@mui/material'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppAvatar } from '@/components/common/AppAvatar'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { AiInsightCard } from '@/components/common/AiInsightCard'
import { interviewApi } from '@/api/interviewApi'
import { initialsFromFullName } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'
import type { PanelistFeedback } from '@/types/interview'

const RECOMMENDATION_LABELS: Record<string, string> = {
  StrongHire: 'Strong Hire',
  Hire: 'Hire',
  Hold: 'Hold',
  Reject: 'Reject',
}

function RatingRow({ label, value }: { label: string; value?: number }) {
  if (value == null) return null
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Rating value={value} max={5} size="small" readOnly />
    </Stack>
  )
}

export default function InterviewFeedbackPage() {
  const { interviewId } = useParams<{ interviewId: string }>()
  const numericId = Number(interviewId)

  const { data, isLoading } = useQuery({
    queryKey: ['feedbackSummary', numericId],
    queryFn: () => interviewApi.feedbackSummary(numericId),
    enabled: Number.isFinite(numericId),
  })

  if (isLoading) return <LoadingSpinner fullPage label="Loading feedback…" />

  return (
    <>
      <PageHeader
        title="Interview Feedback"
        description="Consolidated panel evaluation"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.hiringManagerDashboard }, { label: 'Interview Feedback' }]}
      />

      {!data || data.panel.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<RateReviewOutlinedIcon fontSize="medium" />}
            title="No feedback yet"
            description="Panelist scorecards will appear here once interviewers submit their evaluations."
          />
        </SectionCard>
      ) : (
        <Stack spacing={2.5}>
          <AiInsightCard title="Consolidated Recommendation">
            <Typography variant="h6" sx={{ color: '#8F7C71' }}>
              {RECOMMENDATION_LABELS[data.consolidatedRecommendation] ?? data.consolidatedRecommendation}
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
              Aggregated from {data.panel.length} panelist{data.panel.length > 1 ? 's' : ''}. Review individual
              scorecards below before making the final decision.
            </Typography>
          </AiInsightCard>

          <Grid container spacing={2.5}>
            {data.panel.map((p: PanelistFeedback, i) => (
              <Grid key={p.interviewerId ?? i} size={{ xs: 12, md: 6 }}>
                <SectionCard>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <AppAvatar firstName={initialsFromFullName(p.interviewerName ?? `I ${p.interviewerId}`)} size={36} />
                      <Stack>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {p.interviewerName ?? `Interviewer #${p.interviewerId}`}
                        </Typography>
                        <Chip
                          label={RECOMMENDATION_LABELS[p.recommendation] ?? p.recommendation}
                          size="small"
                          sx={{ width: 'fit-content', mt: 0.25 }}
                          color={p.recommendation.includes('Hire') ? 'success' : p.recommendation === 'Reject' ? 'error' : 'default'}
                        />
                      </Stack>
                    </Stack>
                    <Divider />
                    <Stack spacing={1}>
                      <RatingRow label="Technical" value={p.technical} />
                      <RatingRow label="Communication" value={p.communication} />
                      <RatingRow label="Problem Solving" value={p.problemSolving} />
                      <RatingRow label="Domain Knowledge" value={p.domainKnowledge} />
                    </Stack>
                    {p.comments ? (
                      <Typography variant="body2" color="text.secondary">
                        “{p.comments}”
                      </Typography>
                    ) : null}
                  </Stack>
                </SectionCard>
              </Grid>
            ))}
          </Grid>
        </Stack>
      )}
    </>
  )
}
