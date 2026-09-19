import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, Route } from 'lucide-react'

import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrentCustomerClaimDetails, getCurrentCustomerClaimHistory } from '@/services/claimsService'
import { ApiError } from '@/services/api'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function ClaimDetailsPage() {
  const { claimId } = useParams<{ claimId: string }>()
  const claimQuery = useQuery({
    queryKey: ['claims', 'customer', claimId],
    queryFn: () => getCurrentCustomerClaimDetails(claimId ?? ''),
    enabled: Boolean(claimId),
  })
  const historyQuery = useQuery({
    queryKey: ['claims', 'customer', claimId, 'history'],
    queryFn: () => getCurrentCustomerClaimHistory(claimId ?? ''),
    enabled: Boolean(claimId),
  })

  const claim = claimQuery.data ?? null
  const loading = claimQuery.isLoading

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-full" />
          </Card>
        </div>
      </div>
    )
  }

  if (!claim) {
    const status = claimQuery.error instanceof ApiError ? claimQuery.error.status : undefined
    const title = status === 403 ? 'Access Denied' : status === 404 || !claimId ? 'Claim Not Found' : 'Unable to Load Claim'
    const description = status === 403
      ? 'You are not authorized to view this claim.'
      : status === 404 || !claimId
        ? 'The requested claim ID could not be located.'
        : 'Please check your connection and try again.'
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost">
          <Link to="/customer/claims">
            <ArrowLeft className="mr-2 size-4" /> Back to claims
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
          {claimId && status !== 403 && <Button className="mt-4" variant="outline" onClick={() => void claimQuery.refetch()}>Try again</Button>}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={claim.claimNumber}
        description="Review your claim details and current processing status."
        actions={
          <Button asChild variant="outline">
            <Link to={`/customer/claims/${claim.id}/track`}>
              <Route className="size-4 mr-2" /> Track Claim
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Incident details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="leading-7 text-muted-foreground">{claim.description}</p>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Incident date" value={formatDate(claim.incidentDate)} />
              <Detail label="Submitted" value={formatDate(claim.submittedAt)} />
              <Detail label="Claim amount" value={formatCurrency(claim.claimAmount)} />
              <Detail label="Policy" value={claim.policyId} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClaimStatusBadge status={claim.status} />
            <p className="text-sm text-muted-foreground">
              We will notify you as your claim progresses.
            </p>
            <p className="text-sm text-muted-foreground">
              Updated {formatDate(claim.updatedAt)}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Claim history</CardTitle></CardHeader>
        <CardContent>
          {historyQuery.isLoading ? <div className="space-y-4">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
            : historyQuery.isError ? <div className="flex flex-col items-center gap-3 py-6 text-center"><AlertCircle className="size-7 text-destructive" /><div><p className="font-medium">Unable to load claim history</p><p className="mt-1 text-sm text-muted-foreground">Please try again.</p></div><Button variant="outline" onClick={() => void historyQuery.refetch()}>Try again</Button></div>
              : historyQuery.data?.length === 0 ? <p className="text-sm text-muted-foreground">No status updates are available yet.</p>
                : <ol className="space-y-5">{historyQuery.data?.map((entry, index, entries) => <li key={entry.id} className="flex gap-4"><div className="flex flex-col items-center"><CheckCircle2 className="size-5 text-primary" />{index < entries.length - 1 && <div className="mt-2 h-full w-px bg-border" />}</div><div className="min-w-0 pb-2"><div className="flex flex-wrap items-center gap-2"><ClaimStatusBadge status={entry.status} /><span className="text-sm text-muted-foreground">{formatDate(entry.changedAt)}</span></div><p className="mt-2 text-sm text-muted-foreground">{entry.notes ?? 'Status updated.'}</p></div></li>)}</ol>}
        </CardContent>
      </Card>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  )
}
