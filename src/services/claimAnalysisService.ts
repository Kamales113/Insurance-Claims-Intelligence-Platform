import { api } from '@/services/api'
import type { AssistantSource } from '@/services/assistantService'

export type SeverityLevel = 'info' | 'low' | 'medium' | 'high'
export type EvidenceType = 'claim' | 'policy' | 'history' | 'document' | 'knowledge'

export interface ClaimAnalysisFinding {
  title: string
  description: string
  severity: SeverityLevel
}

export interface RiskSignal {
  title: string
  description: string
  severity: SeverityLevel
}

export interface EvidenceItem {
  type: EvidenceType
  description: string
  source: string
}

export interface ClaimAnalysisResponse {
  claim_id: string
  summary: string
  key_findings: ClaimAnalysisFinding[]
  risk_signals: RiskSignal[]
  recommendation: string
  evidence: EvidenceItem[]
  sources: AssistantSource[]
  model?: string
}

export async function analyzeClaim(claimId: string): Promise<ClaimAnalysisResponse> {
  return api.post<ClaimAnalysisResponse>(
    `/api/v1/claims/${encodeURIComponent(claimId)}/ai-analysis`,
  )
}
