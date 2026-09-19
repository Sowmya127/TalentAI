export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  phoneNumber?: string
  /** Role name to register as; omitted = Candidate. Server rejects non-self-registerable roles. */
  requestedRole?: string
  companyName?: string
  organizationEmail?: string
}

export interface RegisterResponse {
  userId: number
  /** ACTIVE (candidate) or PENDING_APPROVAL (approval-required roles). */
  status: 'ACTIVE' | 'PENDING_APPROVAL'
  message: string
}

/** Matches Backend AuthResponse — "role" is the primary role, "roles" the full set. */
export interface AuthResponse {
  token: string
  role: string
  roles: string[]
  expiresIn: number
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  resetToken: string
  newPassword: string
}

export interface MessageResponse {
  message: string
}

/** Decoded, in-memory representation of the authenticated session. */
export interface AuthUser {
  userId: number | null
  email: string
  role: string
  roles: string[]
}
