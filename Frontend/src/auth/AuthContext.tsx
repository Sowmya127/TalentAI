import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { sessionEvents } from '@/api/sessionEvents'
import { tokenStorage } from '@/utils/storage'
import { ROUTES } from '@/constants/routes'
import { toRoleKey, type RoleKey } from '@/constants/roles'
import { getUserIdFromToken } from '@/utils/jwt'
import type { AuthUser, LoginRequest, RegisterRequest } from '@/types/auth'

interface AuthContextValue {
  user: AuthUser | null
  roleKeys: RoleKey[]
  isAuthenticated: boolean
  login: (payload: LoginRequest) => Promise<AuthUser>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
  hasRole: (...roles: RoleKey[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function hydrate(): AuthUser | null {
  const token = tokenStorage.getToken()
  if (!token) return null
  const role = tokenStorage.getRole()
  const email = tokenStorage.getEmail()
  if (!role || !email) return null
  return { userId: getUserIdFromToken(token), email, role, roles: tokenStorage.getRoles() }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(() => hydrate())

  useEffect(() => {
    return sessionEvents.subscribe('unauthorized', () => {
      setUser(null)
      navigate(ROUTES.sessionExpired, { replace: true })
    })
  }, [navigate])

  const login = useCallback(async (payload: LoginRequest) => {
    const res = await authApi.login(payload)
    tokenStorage.setSession({
      token: res.token,
      role: res.role,
      roles: res.roles,
      email: payload.email,
    })
    const authUser: AuthUser = {
      userId: getUserIdFromToken(res.token),
      email: payload.email,
      role: res.role,
      roles: res.roles,
    }
    setUser(authUser)
    return authUser
  }, [])

  const register = useCallback(async (payload: RegisterRequest) => {
    await authApi.register(payload)
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    navigate(ROUTES.login, { replace: true })
  }, [navigate])

  const roleKeys = useMemo(
    () => (user?.roles ?? []).map(toRoleKey).filter((key): key is RoleKey => key !== undefined),
    [user],
  )

  const hasRole = useCallback((...roles: RoleKey[]) => roles.some((r) => roleKeys.includes(r)), [roleKeys])

  const value = useMemo<AuthContextValue>(
    () => ({ user, roleKeys, isAuthenticated: user !== null, login, register, logout, hasRole }),
    [user, roleKeys, login, register, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
