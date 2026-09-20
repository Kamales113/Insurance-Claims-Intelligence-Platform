import type { UserRole } from '@/constants/claims'
import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  ClipboardList,
  FileText,
  LayoutDashboard,
  PlusCircle,
  Shield,
  Users,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export const customerNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/customer',
    icon: LayoutDashboard,
  },
  {
    title: 'My Claims',
    href: '/customer/claims',
    icon: ClipboardList,
  },
  {
    title: 'Submit Claim',
    href: '/customer/claims/submit',
    icon: PlusCircle,
  },
  {
    title: 'My Policies',
    href: '/customer/policies',
    icon: Shield,
  },
  {
    title: 'Insurance Assistant',
    href: '/customer/assistant',
    icon: Bot,
  },
]

export const agentNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/agent',
    icon: LayoutDashboard,
  },
  {
    title: 'Claims Management',
    href: '/agent/claims',
    icon: ClipboardList,
  },
  {
    title: 'Customers',
    href: '/agent/customers',
    icon: Users,
  },
  {
    title: 'Policies',
    href: '/agent/policies',
    icon: FileText,
  },
  {
    title: 'Insurance Assistant',
    href: '/agent/assistant',
    icon: Bot,
  },
]


export function getNavItemsForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'customer':
      return customerNavItems
    case 'agent':
      return agentNavItems
    case 'admin':
      return agentNavItems
    default:
      return []
  }
}

export function getRoleBasePath(role: UserRole): string {
  switch (role) {
    case 'customer':
      return '/customer'
    case 'agent':
    case 'admin':
      return '/agent'
    default:
      return '/login'
  }
}
