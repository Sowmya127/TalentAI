export interface RoleOption {
  role: string
  description?: string
}

export interface RegistrationRequestSummary {
  requestId: number
  userId: number
  name?: string
  email?: string
  requestedRole?: string
  companyName?: string
  organizationEmail?: string
  status: string
  submittedAt?: string
}

export interface ApprovalHistoryItem {
  approvalId: number
  decision: string
  approverId: number
  approverName?: string
  comments?: string
  actionDate?: string
}

export interface RegistrationRequestDetail {
  requestId: number
  userId: number
  name?: string
  email?: string
  phone?: string
  requestedRole?: string
  companyName?: string
  organizationEmail?: string
  status: string
  verificationStatus?: string
  submittedAt?: string
  reviewedBy?: number | null
  reviewedByName?: string
  reviewedAt?: string
  rejectionReason?: string
  history: ApprovalHistoryItem[]
}

export interface RegistrationDecisionResponse {
  requestId: number
  status: string
  message: string
}

export interface RegistrationQueryParams {
  status?: string
  search?: string
  page?: number
  size?: number
  sortBy?: string
  direction?: string
}
