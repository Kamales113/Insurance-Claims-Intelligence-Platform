import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'

import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrentCustomerClaimDetails, getCurrentCustomerClaimHistory } from '@/services/claimsService'
import { ApiError } from '@/services/api'
import { formatDate } from '@/utils/formatters'

export default function ClaimTrackingPage() {
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
  const history = historyQuery.data
    ? [...historyQuery.data].sort(
        (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
      )
    : []

  if (claimQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!claim) {
    const status = claimQuery.error instanceof ApiError ? claimQuery.error.status : undefined
    const title =
      status === 403
        ? 'Access Denied'
        : status === 404 || !claimId
          ? 'Claim Not Found'
          : 'Unable to Load Claim'
    const description =
      status === 403
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
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          {claimId && status !== 403 && (
            <Button className="mt-4" variant="outline" onClick={() => void claimQuery.refetch()}>
              Try again
            </Button>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Claim Tracking"
        description={`Follow the progress of ${claim.claimNumber}.`}
        actions={
          <Button asChild variant="outline">
            <Link to={`/customer/claims/${claimId}`}>
              <ArrowLeft className="mr-2 size-4" /> Claim details
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          {historyQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : historyQuery.isError ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <AlertCircle className="size-7 text-destructive" />
              <div>
                <p className="font-medium">Unable to load claim history</p>
                <p className="mt-1 text-sm text-muted-foreground">Please try again.</p>
              </div>
              <Button variant="outline" onClick={() => void historyQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No status updates are available yet.</p>
          ) : (
            <ol className="space-y-6">
              {history.map((item, index) => (
                <li key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="size-5 text-primary" />
                    {index < history.length - 1 && <div className="mt-2 h-full w-px bg-border" />}
                  </div>
                  <div className="min-w-0 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <ClaimStatusBadge status={item.status} />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(item.changedAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.notes ?? 'Status updated.'}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

