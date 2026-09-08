import { Outlet } from 'react-router-dom'

import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'
import type { UserRole } from '@/constants/claims'

interface AppLayoutProps {
  role: UserRole
}

export function AppLayout({ role }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar role={role} />
      <div className="lg:pl-64">
        <AppHeader role={role} />
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
