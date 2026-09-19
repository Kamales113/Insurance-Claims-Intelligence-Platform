import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/providers/AuthProvider'

export function AuthLayout() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (user) return <Navigate to={user.role === 'customer' ? '/customer' : '/agent'} replace />
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8">
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
