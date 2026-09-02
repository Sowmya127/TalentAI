import type { ReactNode } from 'react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { SectionCard } from '@/components/common/SectionCard'
import { EmptyState } from '@/components/common/EmptyState'
import { useCandidateProfile } from '@/hooks/useCandidateProfile'
import { ApiError } from '@/api/axiosClient'
import { CreateProfilePrompt } from './CreateProfilePrompt'
import type { CandidateProfile } from '@/types/candidate'

interface CandidateProfileGateProps {
  children: (profile: CandidateProfile) => ReactNode
}

/**
 * Every candidate-scoped screen (profile, resume, skills, education,
 * experience, certifications, applications) needs the logged-in
 * candidate's candidateId first. This resolves it once and renders the
 * right state: loading, "no profile yet" onboarding, a real fetch error,
 * or the page content.
 */
export function CandidateProfileGate({ children }: CandidateProfileGateProps) {
  const { data, isLoading, error } = useCandidateProfile()

  if (isLoading) {
    return <LoadingSpinner fullPage label="Loading your profile…" />
  }

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <CreateProfilePrompt />
    }
    return (
      <SectionCard>
        <EmptyState
          title="Couldn't load your profile"
          description={error instanceof Error ? error.message : 'Please try again in a moment.'}
        />
      </SectionCard>
    )
  }

  if (!data) return null

  return <>{children(data)}</>
}
