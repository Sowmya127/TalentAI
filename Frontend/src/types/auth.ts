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
}

export interface RegisterResponse {
  userId: number
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
