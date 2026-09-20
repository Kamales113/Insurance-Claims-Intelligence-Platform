import { Bot, FileText, User as UserIcon } from 'lucide-react'

import { AssistantSourceCard } from '@/components/assistant/AssistantSourceCard'
import { cn } from '@/lib/utils'
import type { AssistantMessage } from '@/services/assistantService'

interface AssistantMessageItemProps {
  message: AssistantMessage
}

export function AssistantMessageItem({ message }: AssistantMessageItemProps) {
  const isUser = message.role === 'user'

  // Format message content into paragraphs and bullet lists without raw HTML injection
  const renderFormattedContent = (content: string) => {
    const paragraphs = content.split(/\n\s*\n/)
    return paragraphs.map((paragraph, pIdx) => {
      const lines = paragraph.split('\n')
      const isBulletList = lines.every(
        (line) => line.trim().startsWith('- ') || line.trim().startsWith('* '),
      )

      if (isBulletList) {
        return (
          <ul key={pIdx} className="list-disc space-y-1 pl-5 text-sm">
            {lines.map((line, lIdx) => (
              <li key={lIdx}>{line.replace(/^[-*]\s+/, '')}</li>
            ))}
          </ul>
        )
      }

      return (
        <p key={pIdx} className="text-sm leading-relaxed whitespace-pre-line">
          {paragraph}
        </p>
      )
    })
  }

  return (
    <div
      className={cn(
        'flex gap-3 text-sm transition-all',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
          <Bot className="size-4" aria-hidden="true" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] space-y-3 rounded-xl p-4 shadow-sm md:max-w-[75%]',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-none'
            : 'bg-card text-card-foreground border rounded-tl-none',
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b pb-1.5 border-current/10">
          <span className="text-xs font-semibold">
            {isUser ? 'You' : 'Insurance Policy Assistant'}
          </span>
          {message.createdAt && (
            <span className="text-[11px] opacity-70">{message.createdAt}</span>
          )}
        </div>

        <div className="space-y-2">{renderFormattedContent(message.content)}</div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <FileText className="size-3.5" aria-hidden="true" />
              <span>Grounded Knowledge Sources ({message.sources.length})</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {message.sources.map((source) => (
                <AssistantSourceCard key={source.document_id} source={source} />
              ))}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserIcon className="size-4" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}
