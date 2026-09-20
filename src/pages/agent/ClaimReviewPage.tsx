import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, FileText, LoaderCircle } from 'lucide-react'


import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge'
import { ClaimAnalysisCard } from '@/components/claims/ClaimAnalysisCard'
import { PageHeader } from '@/components/layout/PageHeader'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getAgentClaims,
  getClaimHistory,
  updateClaimStatus,
} from '@/services/claimsService'
import { getCustomerWithProfile } from '@/services/customerService'
import { getPolicyWithCustomer } from '@/services/policyService'
import { ApiError } from '@/services/api'
import type { ClaimStatus } from '@/constants/claims'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function ClaimReviewPage() {
  const { claimId } = useParams<{ claimId: string }>()
  const queryClient = useQueryClient()

  const [updating, setUpdating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const claimsQuery = useQuery({
    queryKey: ['claims', 'agent'],
    queryFn: getAgentClaims,
    enabled: Boolean(claimId),
  })

  const claim = claimsQuery.data?.find((c) => c.id === claimId) ?? null

  const historyQuery = useQuery({
    queryKey: ['claims', claimId, 'history'],
    queryFn: () => getClaimHistory(claimId ?? ''),
    enabled: Boolean(claimId),
  })

  const customerQuery = useQuery({
    queryKey: ['customers', claim?.customerId],
    queryFn: () => getCustomerWithProfile(claim?.customerId ?? ''),
    enabled: Boolean(claim?.customerId),
  })

  const policyQuery = useQuery({
    queryKey: ['policies', claim?.policyId],
    queryFn: () => getPolicyWithCustomer(claim?.policyId ?? ''),
    enabled: Boolean(claim?.policyId),
  })

  const loading = claimsQuery.isLoading
  const history = historyQuery.data ?? []
  const customer = customerQuery.data ?? null
  const policy = policyQuery.data ?? null

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full" />
          </Card>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24" />
          </Card>
        </div>
      </div>
    )
  }

  if (!claim) {
    const errorStatus = claimsQuery.error instanceof ApiError ? claimsQuery.error.status : undefined
    const is403 = errorStatus === 403
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost">
          <Link to="/agent/claims">
            <ArrowLeft className="mr-2 size-4" /> Back to claims
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <CardTitle className="text-base font-semibold">
            {is403 ? 'Access Denied' : 'Claim Not Found'}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {is403
              ? 'You are not authorized to view this claim.'
              : 'The requested claim ID could not be located.'}
          </p>
        </Card>
      </div>
    )
  }

  async function action(status: ClaimStatus, note: string) {
    if (!claimId) return
    setActionError(null)
    setUpdating(true)
    try {
      await updateClaimStatus(claimId, status, note)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['claims'] }),
        queryClient.invalidateQueries({ queryKey: ['history'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message)
      } else {
        setActionError('Failed to update claim status. Please try again.')
      }
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={claim.claimNumber}
        description={`${claim.policyType ?? 'General Policy'} · submitted ${formatDate(claim.submittedAt)}`}
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
              disabled={updating}
              onClick={() => action('DOCUMENT_VERIFICATION', 'Additional supporting documents requested.')}
            >
              {updating && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              Request Documents
            </Button>
            <Button
              variant="outline"
              disabled={updating}
              onClick={() => action('UNDER_INVESTIGATION', 'Marked for manual investigation.')}
            >
              {updating && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              Mark for Investigation
            </Button>
            <Button
              disabled={updating}
              onClick={() => action('APPROVAL', 'Approved by claims agent.')}
            >
              {updating && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              Approve
            </Button>
            <Button
              variant="destructive"
              disabled={updating}
              onClick={() => action('REJECTED', 'Rejected by claims agent.')}
            >
              {updating && <LoaderCircle className="mr-2 size-4 animate-spin" />}
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
              <b>{policy?.policyNumber ?? claim.policyNumber ?? '—'}</b> · {policy?.type ?? claim.policyType ?? '—'}
            </p>
            <p>Coverage: {policy ? formatCurrency(policy.coverageAmount) : '—'}</p>
            <p>Status: <span className="capitalize">{policy?.status ?? '—'}</span></p>
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
          {historyQuery.isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history events logged yet.</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="border-l-2 pl-4">
                <ClaimStatusBadge status={item.status} />
                <p className="mt-1 text-sm">{item.notes ?? 'Status updated.'}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.changedAt)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ClaimAnalysisCard claimId={claim.id} />

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

