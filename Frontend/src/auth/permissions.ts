import { RoleKey } from '@/constants/roles'

/**
 * Route/nav-level access groups. Distinct from what the backend actually
 * enforces via @PreAuthorize (e.g. UserController's mutating endpoints
 * require SYSTEM_ADMIN specifically) — those checks are the source of
 * truth for authorization; groups here only control which sidebar
 * sections and pages a role can *see*. HR Admin is included in the
 * systemAdmin-owned Administration module because System Admin is a
 * superset of HR Admin in this org model; any action the backend
 * rejects still surfaces as a normal 403 in the UI.
 */
export const ROLE_GROUPS = {
  candidate: [RoleKey.CANDIDATE],
  recruiter: [RoleKey.RECRUITER],
  hiringManager: [RoleKey.HIRING_MANAGER],
  interviewer: [RoleKey.INTERVIEWER],
  hrAdmin: [RoleKey.HR_ADMIN, RoleKey.SYSTEM_ADMIN],
  systemAdmin: [RoleKey.SYSTEM_ADMIN],
  anyInternal: [
    RoleKey.RECRUITER,
    RoleKey.HIRING_MANAGER,
    RoleKey.INTERVIEWER,
    RoleKey.HR_ADMIN,
    RoleKey.SYSTEM_ADMIN,
  ],
} as const satisfies Record<string, RoleKey[]>

export type RoleGroupName = keyof typeof ROLE_GROUPS
