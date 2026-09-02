/** POST /ai/candidate-match response (API spec §7). */
export interface AiMatchBreakdown {
  skills: number
  experience: number
  education: number
  preferredSkills: number
}

export interface PartialMatch {
  skill: string
  note: string
}

export interface AiMatchResult {
  matchId: number
  candidateId: number
  jobId: number
  overallMatch: number
  breakdown: AiMatchBreakdown
  matchedSkills: string[]
  partialMatches: PartialMatch[]
  missingSkills: string[]
}

/** A row in GET /jobs/{jobId}/ranking. */
export interface RankedCandidate {
  candidateId: number
  name: string
  matchScore: number
  status: string
}

export interface SkillGap {
  candidateId: number
  jobId: number
  matched: string[]
  partial: string[]
  missing: string[]
}
