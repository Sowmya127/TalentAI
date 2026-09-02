import { axiosClient } from './axiosClient'
import { ENDPOINTS } from './endpoints'
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
} from '@/types/auth'

export const authApi = {
  register: (payload: RegisterRequest) =>
    axiosClient.post<RegisterResponse>(ENDPOINTS.auth.register, payload).then((res) => res.data),

  login: (payload: LoginRequest) =>
    axiosClient.post<AuthResponse>(ENDPOINTS.auth.login, payload).then((res) => res.data),

  // Not yet implemented on the backend (see API spec §1) — wired to the
  // documented contract so the UI is ready once AuthController adds it.
  forgotPassword: (payload: ForgotPasswordRequest) =>
    axiosClient.post<MessageResponse>(ENDPOINTS.auth.forgotPassword, payload).then((res) => res.data),

  resetPassword: (payload: ResetPasswordRequest) =>
    axiosClient.post<MessageResponse>(ENDPOINTS.auth.resetPassword, payload).then((res) => res.data),
}
