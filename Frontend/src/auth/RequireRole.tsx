import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import type { RoleKey } from '@/constants/roles'

export function RequireRole({ roles, children }: { roles: RoleKey[]; children: ReactNode }) {
  const { hasRole } = useAuth()

  if (!hasRole(...roles)) {
    return <Navigate to={ROUTES.unauthorized} replace />
  }

  return children
}
