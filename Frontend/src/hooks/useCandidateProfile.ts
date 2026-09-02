import { useQuery } from '@tanstack/react-query'
import { candidateApi } from '@/api/candidateApi'

export const candidateProfileQueryKey = ['candidateProfile', 'me'] as const

export function useCandidateProfile() {
  return useQuery({
    queryKey: candidateProfileQueryKey,
    queryFn: candidateApi.getMyProfile,
    // A 404 here means "no profile yet" (a normal, expected state for a
    // freshly-registered candidate), not a transient failure — don't retry it.
    retry: false,
  })
}
