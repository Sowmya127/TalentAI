import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type {
  AssignRoleRequest,
  AuditLogEntry,
  AuditLogParams,
  CreateRoleRequest,
  CreateRoleResponse,
  Role,
} from '@/types/admin'
import type { ListEnvelope } from '@/types/common'

export const adminApi = {
  getRoles: () =>
    axiosClient.get<ListEnvelope<Role>>(ENDPOINTS.admin.roles).then((res) => res.data),

  createRole: (payload: CreateRoleRequest) =>
    axiosClient.post<CreateRoleResponse>(ENDPOINTS.admin.roles, payload).then((res) => res.data),

  assignRole: (userId: number, payload: AssignRoleRequest) =>
    axiosClient
      .post<{ userId: number; roles: string[] }>(ENDPOINTS.admin.assignRole(userId), payload)
      .then((res) => res.data),

  audit: (params: AuditLogParams) =>
    axiosClient.get<ListEnvelope<AuditLogEntry>>(ENDPOINTS.admin.audit, { params }).then((res) => res.data),
}
