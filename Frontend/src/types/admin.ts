export interface Role {
  roleId: number
  name: string
}

export interface CreateRoleRequest {
  name: string
  permissions: string[]
}

export interface CreateRoleResponse {
  roleId: number
  message: string
}

export interface AssignRoleRequest {
  roleId: number
}

export interface AuditLogEntry {
  user: string
  action: string
  entity: string
  timestamp: string
  previousValue?: string | null
  newValue?: string | null
}

export interface AuditLogParams {
  entityType?: string
  entityId?: string | number
  page?: number
  size?: number
}
