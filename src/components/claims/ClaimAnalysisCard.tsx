import { useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileCheck,
  Info as InfoIcon,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

import { AssistantSourceCard } from '@/components/assistant/AssistantSourceCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError } from '@/services/api'
import {
  analyzeClaim,
  type ClaimAnalysisResponse,
  type SeverityLevel,
} from '@/services/claimAnalysisService'

interface ClaimAnalysisCardProps {
  claimId: string
}

function getSeverityColorClasses(severity: SeverityLevel) {

  switch (severity) {
    case 'high':
      return 'bg-destructive/15 text-destructive border-destructive/30'
    case 'medium':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
    case 'low':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
    case 'info':
    default:
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30'
  }
}

export function ClaimAnalysisCard({ claimId }: ClaimAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<ClaimAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleRunAnalysis = async () => {
    setErrorMsg(null)
    setLoading(true)

    try {
      const data = await analyzeClaim(claimId)
      setAnalysis(data)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrorMsg('Your session may have expired. Please try logging in again.')
        } else if (err.status === 403) {
          setErrorMsg('You do not have permission to run AI analysis for this claim.')
        } else if (err.status === 404) {
          setErrorMsg('Claim not found.')
        } else if (err.status === 503 || err.message.toLowerCase().includes('not configured')) {
          setErrorMsg('AI Claim Analysis is currently unavailable because the AI service is not configured.')
        } else {
          setErrorMsg(err.message || 'Something went wrong while analyzing this claim. Please try again.')
        }
      } else {
        setErrorMsg('Something went wrong while analyzing this claim. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-amber-500" aria-hidden="true" />
            <CardTitle className="text-base font-semibold">AI Claim Analysis</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            AI-assisted review of claim parameters, policy guidelines, evidence, and review signals.
          </p>
        </div>

        {analysis ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunAnalysis}
            disabled={loading}
            className="shrink-0 text-xs"
          >
            {loading ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="mr-1.5 size-3.5" />
            )}
            Run Analysis Again
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleRunAnalysis}
            disabled={loading}
            className="shrink-0 text-xs"
          >
            {loading ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 size-3.5" />
            )}
            Run AI Analysis
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Error Alert */}
        {errorMsg && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunAnalysis}
              className="h-7 text-xs border-destructive/30 hover:bg-destructive/20"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
              <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Analyzing Claim Context...</p>
              <p className="text-xs text-muted-foreground">
                Evaluating policy limits, coverage guidelines, document metadata, and status history.
              </p>
            </div>
          </div>
        )}

        {/* Initial Empty State */}
        {!analysis && !loading && !errorMsg && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 max-w-md mx-auto">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileCheck className="size-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No AI Analysis Run Yet</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Run an analysis to review this claim using available claim details, policy coverage, document registry, and policy knowledge guidelines.
              </p>
            </div>
            <Button size="sm" onClick={handleRunAnalysis} className="text-xs">
              <Sparkles className="mr-1.5 size-3.5" />
              Run AI Analysis
            </Button>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && !loading && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <InfoIcon className="size-4 text-primary" aria-hidden="true" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  AI-Assisted Summary
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{analysis.summary}</p>
            </div>

            {/* Key Findings & Risk Signals Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Key Findings */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                  Key Findings ({analysis.key_findings.length})
                </h3>
                {analysis.key_findings.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No key findings logged.</p>
                ) : (
                  <div className="space-y-2.5">
                    {analysis.key_findings.map((finding, idx) => (
                      <div key={idx} className="rounded-md border p-3 bg-card space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-foreground">{finding.title}</h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityColorClasses(finding.severity)}`}
                          >
                            {finding.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {finding.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Risk Signals */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldAlert className="size-4 text-amber-500" aria-hidden="true" />
                  Risk Signals ({analysis.risk_signals.length})
                </h3>
                {analysis.risk_signals.length === 0 ? (
                  <div className="rounded-md border border-dashed p-3 bg-muted/10 text-xs text-muted-foreground italic">
                    No significant risk signals were identified from the available claim context.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {analysis.risk_signals.map((signal, idx) => (
                      <div key={idx} className="rounded-md border p-3 bg-card space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-foreground">{signal.title}</h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityColorClasses(signal.severity)}`}
                          >
                            {signal.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {signal.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Evidence Considered */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileCheck className="size-4 text-primary" aria-hidden="true" />
                Evidence Considered ({analysis.evidence.length})
              </h3>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {analysis.evidence.map((item, idx) => (
                  <div key={idx} className="rounded-md border p-3 bg-card space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="capitalize text-[10px] font-medium">
                        {item.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground truncate">
                        Source: {item.source}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pt-1">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Policy Knowledge Sources */}
            {analysis.sources && analysis.sources.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="size-4 text-primary" aria-hidden="true" />
                  Policy Knowledge Sources ({analysis.sources.length})
                </h3>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {analysis.sources.map((source) => (
                    <AssistantSourceCard key={source.document_id} source={source} />
                  ))}
                </div>
              </div>
            )}

            {/* AI Recommendation Banner */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    AI Recommendation
                  </h4>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-800 dark:text-amber-300">
                  Informational
                </Badge>
              </div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                {analysis.recommendation}
              </p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 pt-1 border-t border-amber-500/20">
                This AI recommendation is informational and non-binding. Final claim decisions remain the responsibility of the human insurance agent.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
