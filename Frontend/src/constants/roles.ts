/**
 * Mirrors the six roles seeded by Backend/.../common/enums/RoleName.java
 * (V25__seed_reference_data.sql). Kept as a const object rather than a
 * TypeScript `enum` — the app's tsconfig has erasableSyntaxOnly on.
 */
export const RoleKey = {
  CANDIDATE: 'CANDIDATE',
  RECRUITER: 'RECRUITER',
  HIRING_MANAGER: 'HIRING_MANAGER',
  INTERVIEWER: 'INTERVIEWER',
  HR_ADMIN: 'HR_ADMIN',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
} as const

export type RoleKey = (typeof RoleKey)[keyof typeof RoleKey]

export const ROLE_LABELS: Record<RoleKey, string> = {
  CANDIDATE: 'Candidate',
  RECRUITER: 'Recruiter',
  HIRING_MANAGER: 'Hiring Manager',
  INTERVIEWER: 'Interviewer',
  HR_ADMIN: 'HR Admin',
  SYSTEM_ADMIN: 'System Admin',
}

/**
 * The backend represents a role three different ways depending on the
 * endpoint: JWT claims use "ROLE_HIRING_MANAGER" (Spring Security
 * convention), UserResponse.roles uses the seeded display name "Hiring
 * Manager", and the request-only roleName field expects the same
 * display name. Normalizing to a single alphanumeric-uppercase key
 * lets the rest of the app compare roles without caring which shape
 * it received.
 */
function normalize(raw: string): string {
  return raw
    .replace(/^ROLE_/, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
}

const NORMALIZED_TO_KEY: Record<string, RoleKey> = Object.fromEntries(
  (Object.keys(RoleKey) as RoleKey[]).map((key) => [normalize(key), key]),
) as Record<string, RoleKey>

export function toRoleKey(raw: string): RoleKey | undefined {
  return NORMALIZED_TO_KEY[normalize(raw)]
}

export function roleLabel(raw: string): string {
  const key = toRoleKey(raw)
  return key ? ROLE_LABELS[key] : raw
}
