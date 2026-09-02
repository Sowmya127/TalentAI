export type UserStatus = 'Active' | 'Inactive' | 'Suspended'

/** Matches Backend UserResponse exactly (user/dto/UserResponse.java). */
export interface UserResponse {
  userId: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  userStatus: UserStatus
  roles: string[]
  isActive: boolean
}

/** Matches Backend CreateUserRequest — admin-created internal accounts only. */
export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  roleName: string
  phoneNumber?: string
}

/** Matches Backend UpdateUserRequest — all fields optional, self or admin. */
export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  phoneNumber?: string
}

export interface UpdateUserStatusRequest {
  status: UserStatus
}

export interface SearchUsersParams {
  role?: string
  status?: UserStatus
  page?: number
  size?: number
}
