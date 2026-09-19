import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import { PageLoadingSkeleton } from '@/components/layout/PagePlaceholder'
import type { UserRole } from '@/constants/claims'
import { getRoleBasePath } from '@/routes/navigation'
import { useAuth } from '@/providers/AuthProvider'

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <main className="p-8"><PageLoadingSkeleton /></main>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (user.role !== role) return <Navigate to={getRoleBasePath(user.role)} replace />
  return children
}
