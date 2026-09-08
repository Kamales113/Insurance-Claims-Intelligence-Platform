import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, BrainCircuit, FileText } from 'lucide-react'

import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type AgentClaimWithCustomer,
  getAgentClaims,
  getClaimHistory,
  updateClaimStatus,
} from '@/services/claimsService'
import { type CustomerWithProfile, getCustomerWithProfile } from '@/services/customerService'
import { type PolicyWithCustomer, getPolicyWithCustomer } from '@/services/policyService'
import type { ClaimStatusHistory } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function ClaimReviewPage() {
  const { claimId } = useParams<{ claimId: string }>()
  const [claim, setClaim] = useState<AgentClaimWithCustomer | null>(null)
  const [history, setHistory] = useState<ClaimStatusHistory[]>([])
  const [customer, setCustomer] = useState<CustomerWithProfile | null>(null)
  const [policy, setPolicy] = useState<PolicyWithCustomer | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function load() {
    if (!claimId) return
    const found = (await getAgentClaims()).find((item) => item.id === claimId) ?? null
    setClaim(found)
    if (found) {
      const [entries, profile, activePolicy] = await Promise.all([
        getClaimHistory(found.id),
        getCustomerWithProfile(found.customerId),
        getPolicyWithCustomer(found.policyId),
      ])
      setHistory(entries)
      setCustomer(profile)
      setPolicy(activePolicy)
    }
  }

  useEffect(() => {
    void load()
  }, [claimId])

  if (!claim) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost">
          <Link to="/agent/claims">
            <ArrowLeft className="mr-2 size-4" /> Back to claims
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Claim not found or loading…</p>
      </div>
    )
  }

  async function action(
    status: 'DOCUMENT_VERIFICATION' | 'UNDER_INVESTIGATION' | 'APPROVAL' | 'REJECTED',
    note: string
  ) {
    if (!claim) return
    setActionError(null)
    try {
      await updateClaimStatus(claim.id, status, note)
      await load()
    } catch (_err) {
      setActionError('Failed to update claim status. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={claim.claimNumber}
        description={`${claim.policyType} · submitted ${formatDate(claim.submittedAt)}`}
        actions={<ClaimStatusBadge status={claim.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Claim overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Info label="Claim amount" value={formatCurrency(claim.claimAmount)} />
            <Info label="Incident date" value={formatDate(claim.incidentDate)} />
            <Info
              label="Customer"
              value={customer ? `${customer.user.firstName} ${customer.user.lastName}` : claim.customerName}
            />
            <Info
              label="Contact"
              value={customer ? `${customer.user.email} · ${customer.phone}` : claim.customerEmail}
            />
            <div className="sm:col-span-2">
              <Info label="Description" value={claim.description} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {actionError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => action('DOCUMENT_VERIFICATION', 'Additional supporting documents requested.')}
            >
              Request Documents
            </Button>
            <Button
              variant="outline"
              onClick={() => action('UNDER_INVESTIGATION', 'Marked for manual investigation.')}
            >
              Mark for Investigation
            </Button>
            <Button onClick={() => action('APPROVAL', 'Approved by claims agent.')}>
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => action('REJECTED', 'Rejected by claims agent.')}
            >
              Reject
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Policy information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <b>{policy?.policyNumber}</b> · {policy?.type}
            </p>
            <p>Coverage: {policy ? formatCurrency(policy.coverageAmount) : '—'}</p>
            <p>Status: {policy?.status ?? '—'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <FileText className="mr-2 inline size-4" />
              Supporting documents
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No mock documents are attached to this claim.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Claim history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="border-l-2 pl-4">
              <ClaimStatusBadge status={item.status} />
              <p className="mt-1 text-sm">{item.notes}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.changedAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex gap-3 p-6">
          <BrainCircuit className="size-6 text-muted-foreground shrink-0" />
          <div>
            <h2 className="font-semibold">AI Investigation — Coming in Phase 3</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Future reviews will include policy validation, fraud assessment, document verification, evidence, and decision traceability.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  )
}
