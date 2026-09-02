import axios, { type AxiosError } from 'axios'
import { env } from '@/config/env'
import { tokenStorage } from '@/utils/storage'
import { sessionEvents } from './sessionEvents'
import type { ApiErrorBody } from '@/types/common'

export const axiosClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use((config) => {
  const token = tokenStorage.getToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// Endpoints that legitimately return 401 as part of a normal flow (bad
// credentials) rather than an expired session — never force a redirect for these.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register']

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.includes(path))

    if (status === 401 && !isAuthEndpoint && tokenStorage.getToken()) {
      tokenStorage.clear()
      sessionEvents.emit('unauthorized')
    }

    const message = error.response?.data?.message ?? error.message ?? 'Something went wrong.'
    return Promise.reject(new ApiError(message, status, error.response?.data?.errorCode))
  },
)

export class ApiError extends Error {
  status?: number
  errorCode?: string

  constructor(message: string, status?: number, errorCode?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errorCode = errorCode
  }
}
