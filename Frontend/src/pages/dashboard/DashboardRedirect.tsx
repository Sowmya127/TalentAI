import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultRouteForRoles } from '@/constants/navigation'

/** Landing target for "/" and "/dashboard" — sends the user to their role's dashboard. */
export default function DashboardRedirect() {
  const { roleKeys } = useAuth()
  return <Navigate to={getDefaultRouteForRoles(roleKeys)} replace />
}
