import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type { ListEnvelope } from '@/types/common'
import type {
  ApprovalHistoryItem,
  RegistrationDecisionResponse,
  RegistrationQueryParams,
  RegistrationRequestDetail,
  RegistrationRequestSummary,
  RoleOption,
} from '@/types/registration'

export const registrationApi = {
  /** Public — roles for the "Register as" selector (System Admin excluded). */
  getSelfRegisterableRoles: () =>
    axiosClient.get<RoleOption[]>(ENDPOINTS.registration.selfRegisterableRoles).then((res) => res.data),

  // --- Admin approval module ---
  list: (params: RegistrationQueryParams) =>
    axiosClient
      .get<ListEnvelope<RegistrationRequestSummary>>(ENDPOINTS.registration.requests, { params })
      .then((res) => res.data),

  detail: (id: number) =>
    axiosClient.get<RegistrationRequestDetail>(ENDPOINTS.registration.request(id)).then((res) => res.data),

  history: (id: number) =>
    axiosClient.get<ApprovalHistoryItem[]>(ENDPOINTS.registration.history(id)).then((res) => res.data),

  approve: (id: number, comments?: string) =>
    axiosClient
      .patch<RegistrationDecisionResponse>(ENDPOINTS.registration.approve(id), { comments })
      .then((res) => res.data),

  reject: (id: number, reason: string) =>
    axiosClient
      .patch<RegistrationDecisionResponse>(ENDPOINTS.registration.reject(id), { reason })
      .then((res) => res.data),
}
