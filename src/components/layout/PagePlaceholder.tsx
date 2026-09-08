import type { ReactNode } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

interface PagePlaceholderProps {
  title: string
  description: string
  children?: ReactNode
}

export function PagePlaceholder({
  title,
  description,
  children,
}: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {children ?? (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            This page is scaffolded and ready for implementation.
          </p>
        </div>
      )}
    </div>
  )
}

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  )
}
