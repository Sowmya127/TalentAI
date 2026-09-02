import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type {
  CreateUserRequest,
  SearchUsersParams,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UserResponse,
} from '@/types/user'
import type { SpringPage } from '@/types/common'

export const userApi = {
  createUser: (payload: CreateUserRequest) =>
    axiosClient.post<UserResponse>(ENDPOINTS.users.create, payload).then((res) => res.data),

  getUser: (userId: number) =>
    axiosClient.get<UserResponse>(ENDPOINTS.users.byId(userId)).then((res) => res.data),

  updateUser: (userId: number, payload: UpdateUserRequest) =>
    axiosClient.put<UserResponse>(ENDPOINTS.users.byId(userId), payload).then((res) => res.data),

  updateUserStatus: (userId: number, payload: UpdateUserStatusRequest) =>
    axiosClient.patch<UserResponse>(ENDPOINTS.users.status(userId), payload).then((res) => res.data),

  searchUsers: (params: SearchUsersParams) =>
    axiosClient
      .get<SpringPage<UserResponse>>(ENDPOINTS.users.search, { params })
      .then((res) => res.data),

  // Inferred endpoint (see endpoints.ts) — self-service password change.
  changePassword: (userId: number, payload: { currentPassword: string; newPassword: string }) =>
    axiosClient.post<{ message: string }>(ENDPOINTS.users.changePassword(userId), payload).then((res) => res.data),
}
