import { Shield } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { APP_NAME } from '@/constants/app'
import type { UserRole } from '@/constants/claims'
import { cn } from '@/lib/utils'
import { getNavItemsForRole } from '@/routes/navigation'

interface AppSidebarProps {
  role: UserRole
}

export function AppSidebar({ role }: AppSidebarProps) {
  const navItems = getNavItemsForRole(role)

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-sidebar lg:block">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Shield className="size-6 text-sidebar-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground">{APP_NAME}</p>
          <p className="text-xs text-sidebar-foreground/70">Enterprise Portal</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-4" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/customer' || item.href === '/agent'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              )
            }
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            {item.title}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
