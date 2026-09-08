import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  className?: string
  valueClassName?: string
}

export function SummaryCard({
  title,
  value,
  description,
  icon,
  className,
  valueClassName,
}: SummaryCardProps) {
  return (
    <Card className={cn('overflow-hidden transition-all hover:border-primary/40', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && (
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
        <div className="mt-3">
          <div className={cn('text-2xl font-bold tracking-tight md:text-3xl', valueClassName)}>
            {value}
          </div>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
