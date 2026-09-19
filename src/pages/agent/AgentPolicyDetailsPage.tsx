import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'

import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getClaimsByPolicyId } from '@/services/claimsService'
import { getCustomerWithProfile } from '@/services/customerService'
import { getPolicyWithCustomer } from '@/services/policyService'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function AgentPolicyDetailsPage() {
  const { policyId } = useParams<{ policyId: string }>()

  const policyQuery = useQuery({
    queryKey: ['policies', policyId],
    queryFn: () => getPolicyWithCustomer(policyId ?? ''),
    enabled: Boolean(policyId),
  })

  const policy = policyQuery.data ?? null

  const customerQuery = useQuery({
    queryKey: ['customers', policy?.customerId],
    queryFn: () => getCustomerWithProfile(policy?.customerId ?? ''),
    enabled: Boolean(policy?.customerId),
  })

  const claimsQuery = useQuery({
    queryKey: ['claims', 'policy', policyId],
    queryFn: () => getClaimsByPolicyId(policyId ?? ''),
    enabled: Boolean(policyId),
  })

  const customer = customerQuery.data ?? null
  const claims = claimsQuery.data ?? []

  if (policyQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
          </Card>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
          </Card>
        </div>
      </div>
    )
  }

  if (!policy) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost">
          <Link to="/agent/policies">
            <ArrowLeft className="mr-2 size-4" /> Policies
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <CardTitle className="text-base font-semibold">Policy Not Found</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            The requested policy could not be located.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={policy.policyNumber} description={policy.type} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Policy information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <b>Coverage</b>
              <br />
              {formatCurrency(policy.coverageAmount)}
            </p>
            <p>
              <b>Premium</b>
              <br />
              {formatCurrency(policy.premium)}
            </p>
            <p>
              <b>Status</b>
              <br />
              <span className="capitalize">{policy.status}</span>
            </p>
            <p>
              <b>Period</b>
              <br />
              {formatDate(policy.startDate)} – {formatDate(policy.endDate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {customerQuery.isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : customer ? (
              <>
                <p className="font-medium">
                  {customer.user.firstName} {customer.user.lastName}
                </p>
                <p>{customer.user.email}</p>
                <p>{customer.phone}</p>
                <Button asChild variant="link" className="mt-2 px-0">
                  <Link to={`/agent/customers/${customer.id}`}>View customer</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">{policy.customerName ?? 'Customer information unavailable'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Related claims</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {claimsQuery.isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : claims.length ? (
            claims.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between gap-3 border-b pb-3 text-sm">
                <div>
                  <b>{claim.claimNumber}</b>
                  <p className="text-muted-foreground">
                    {formatCurrency(claim.claimAmount)} · {formatDate(claim.submittedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ClaimStatusBadge status={claim.status} />
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/agent/claims/${claim.id}`}>Review</Link>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No related claims.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

