import { Badge } from '@/components/ui/badge'
import { CLAIM_STATUS_LABELS, type ClaimStatus } from '@/constants/claims'
import { cn } from '@/lib/utils'

interface ClaimStatusBadgeProps {
  status: ClaimStatus
  className?: string
}

const statusStyles: Record<ClaimStatus, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  DOCUMENT_VERIFICATION: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
  POLICY_VALIDATION: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  UNDER_INVESTIGATION: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  FRAUD_ASSESSMENT: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  APPROVAL: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  PAYMENT_PENDING: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
  PAID: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
}

export function ClaimStatusBadge({ status, className }: ClaimStatusBadgeProps) {
  const label = CLAIM_STATUS_LABELS[status] || status
  const style = statusStyles[status] || 'bg-secondary text-secondary-foreground'

  return (
    <Badge variant="outline" className={cn('font-medium shadow-none', style, className)}>
      {label}
    </Badge>
  )
}
