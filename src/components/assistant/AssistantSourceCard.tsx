import { BookOpen } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { AssistantSource } from '@/services/assistantService'

interface AssistantSourceCardProps {
  source: AssistantSource
}

export function AssistantSourceCard({ source }: AssistantSourceCardProps) {
  const relevancePct = Math.round(source.similarity * 100)

  return (
    <Card className="overflow-hidden border bg-card/60 transition-colors hover:bg-card">
      <CardContent className="p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs font-normal">
            {source.policy_type}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">
            Relevance: {relevancePct}%
          </span>
        </div>

        <div className="flex items-start gap-2">
          <BookOpen className="mt-0.5 size-4 shrink-0 text-primary/80" aria-hidden="true" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold leading-snug text-foreground">
              {source.title}
            </h4>
            <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
              {source.source}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-1 border-t text-[11px] text-muted-foreground">
          <span className="capitalize font-medium text-foreground/80">Category: {source.category}</span>
          <span>•</span>
          <span className="truncate">Doc ID: {source.document_id}</span>
        </div>
      </CardContent>
    </Card>
  )
}
