import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Route } from 'lucide-react'

import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getClaimById } from '@/services/claimsService'
import { getPolicyById } from '@/services/policyService'
import type { Claim, Policy } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function ClaimDetailsPage() {
  const { claimId } = useParams<{ claimId: string }>()
  const [claim, setClaim] = useState<Claim | null>(null)
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        if (!claimId) return
        const found = await getClaimById(claimId)
        setClaim(found)
        if (found) {
          setPolicy(await getPolicyById(found.policyId))
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [claimId])

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
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost">
          <Link to="/customer/claims">
            <ArrowLeft className="mr-2 size-4" /> Back to claims
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <CardTitle className="text-base font-semibold">Claim Not Found</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            The requested claim ID could not be located.
          </p>
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
              <Detail label="Policy" value={policy?.policyNumber ?? '—'} />
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
