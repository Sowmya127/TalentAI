import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultRouteForRoles } from '@/constants/navigation'

/** Keeps already-authenticated users off the login/register/forgot-password screens. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, roleKeys } = useAuth()

  if (isAuthenticated) {
    return <Navigate to={getDefaultRouteForRoles(roleKeys)} replace />
  }

  return children
}
