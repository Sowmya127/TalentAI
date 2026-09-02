export type OfferStatus = 'Draft' | 'Approved' | 'Sent' | 'Accepted' | 'Declined' | 'Expired' | 'Rescinded' | 'Rejected'

export interface Compensation {
  baseSalary: number
  currency: string
  variablePay?: number
}

export interface Offer {
  offerId: number
  applicationId: number
  status: OfferStatus
  compensation: Compensation
  joiningDate: string
  candidateName?: string
  jobTitle?: string
}

export interface GenerateOfferRequest {
  applicationId: number
  compensation: Compensation
  joiningDate: string
}

export interface OfferStatusResponse {
  offerId: number
  status: OfferStatus
  sentAt?: string
  respondedAt?: string
}

/** PATCH /offers/{offerId}/approve — approve OR reject (decision field). */
export interface ApproveOfferRequest {
  decision: 'Approved' | 'Rejected'
  comments?: string
}
