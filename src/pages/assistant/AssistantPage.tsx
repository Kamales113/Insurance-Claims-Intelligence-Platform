import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Bot, Filter, Loader2, RotateCcw, Send, Sparkles } from 'lucide-react'

import { AssistantMessageItem } from '@/components/assistant/AssistantMessageItem'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ApiError } from '@/services/api'
import {
  askAssistant,
  type AssistantMessage,
} from '@/services/assistantService'


const POLICY_TYPES = [
  'Auto Comprehensive',
  'Homeowners Protection',
  'Individual Health Premier',
  'Auto Liability',
  'Commercial Property',
]

const SUGGESTED_QUESTIONS = [
  'What does Auto Comprehensive insurance cover?',
  'What are common exclusions in Homeowners Protection?',
  'How does a deductible work for auto claims?',
  'What documents are needed for an Individual Health claim?',
  'What should I know before submitting an insurance claim?',
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [selectedPolicyType, setSelectedPolicyType] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputMessage).trim()
    if (!text || loading) return

    setErrorMsg(null)

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      const response = await askAssistant({
        message: text,
        policy_type: selectedPolicyType || undefined,
        top_k: 5,
      })

      const assistantMessage: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrorMsg('Your session may have expired. Please try logging in again.')
        } else if (err.status === 503 || err.message.toLowerCase().includes('not configured')) {
          setErrorMsg('Insurance Assistant is currently unavailable because the AI service is not configured.')
        } else {
          setErrorMsg(err.message || 'Something went wrong while contacting the Insurance Assistant. Please try again.')
        }
      } else {
        setErrorMsg('Something went wrong while contacting the Insurance Assistant. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSendMessage()
    }
  }

  const handleClearConversation = () => {
    setMessages([])
    setErrorMsg(null)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Insurance Assistant"
        description="Ask questions about insurance coverage, exclusions, deductibles, claims, and documentation."
      />

      {/* Controls Bar: Policy Type Filter & Clear Conversation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="policy-filter" className="text-xs font-medium text-muted-foreground">
            Filter by Policy:
          </label>
          <select
            id="policy-filter"
            value={selectedPolicyType}
            onChange={(e) => setSelectedPolicyType(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Policy Types</option>
            {POLICY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearConversation}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1.5 size-3.5" aria-hidden="true" />
            Clear conversation
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}


      {/* Conversation Area */}
      <Card className="flex flex-col h-[560px] overflow-hidden border shadow-sm">
        <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-muted/20">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center max-w-xl mx-auto space-y-5">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                <Bot className="size-6" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold">Insurance Policy Assistant</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ask questions about policy terms, coverage details, exclusions, or claim filing requirements.
                  Answers are grounded directly in our insurance policy knowledge base.
                </p>
              </div>

              <div className="w-full pt-2 space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                  <Sparkles className="size-3.5 text-amber-500" aria-hidden="true" />
                  Suggested questions to get started:
                </p>
                <div className="grid gap-2 text-left">
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => void handleSendMessage(q)}
                      className="w-full p-2.5 text-xs text-left rounded-md border bg-card hover:bg-accent hover:text-accent-foreground transition-colors shadow-xs"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => <AssistantMessageItem key={msg.id} message={msg} />)
          )}

          {loading && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 rounded-lg bg-card border w-fit">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              </div>
              <span className="text-xs font-medium">Assistant is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Composer */}
        <div className="p-3 bg-card border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleSendMessage()
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your insurance policy..."
                rows={2}
                disabled={loading}
                aria-label="Ask about your insurance policy"
                className="w-full resize-none rounded-md border border-input bg-background p-2.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !inputMessage.trim()}
              className="h-14 px-4"
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
