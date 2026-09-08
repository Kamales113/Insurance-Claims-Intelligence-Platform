import { Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

import { APP_NAME } from '@/constants/app'
import type { UserRole } from '@/constants/claims'
import { getRoleBasePath } from '@/routes/navigation'

interface AppHeaderProps {
  role: UserRole
}

export function AppHeader({ role }: AppHeaderProps) {
  const basePath = getRoleBasePath(role)

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <Link to={basePath} className="flex items-center gap-2 font-semibold">
            <Shield className="size-5 text-primary" aria-hidden="true" />
            <span className="text-sm">{APP_NAME}</span>
          </Link>
        </div>

        <div className="hidden lg:block">
          <p className="text-sm text-muted-foreground">
            Insurance Claims Intelligence Platform
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">Demo User</p>
            <p className="text-xs capitalize text-muted-foreground">{role}</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            DU
          </div>
        </div>
      </div>
    </header>
  )
}
