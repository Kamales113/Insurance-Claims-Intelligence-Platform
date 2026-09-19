import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getClaimsByCustomerId } from '@/services/claimsService'
import { getCustomerWithProfile } from '@/services/customerService'
import { getPoliciesByCustomerId } from '@/services/policyService'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function AgentCustomerDetailsPage() {
  const { customerId } = useParams<{ customerId: string }>()

  const customerQuery = useQuery({
    queryKey: ['customers', customerId],
    queryFn: () => getCustomerWithProfile(customerId ?? ''),
    enabled: Boolean(customerId),
  })

  const policiesQuery = useQuery({
    queryKey: ['policies', 'customer', customerId],
    queryFn: () => getPoliciesByCustomerId(customerId ?? ''),
    enabled: Boolean(customerId),
  })

  const claimsQuery = useQuery({
    queryKey: ['claims', 'customer', customerId],
    queryFn: () => getClaimsByCustomerId(customerId ?? ''),
    enabled: Boolean(customerId),
  })

  const customer = customerQuery.data ?? null
  const policies = policiesQuery.data ?? []
  const claims = claimsQuery.data ?? []

  if (customerQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost">
          <Link to="/agent/customers">
            <ArrowLeft className="mr-2 size-4" /> Customers
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <CardTitle className="text-base font-semibold">Customer Not Found</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            The requested customer profile could not be located.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${customer.user.firstName} ${customer.user.lastName}`}
        description="Customer profile, coverage, and claims history."
      />
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <p>
            <b>Email</b>
            <br />
            {customer.user.email}
          </p>
          <p>
            <b>Phone</b>
            <br />
            {customer.phone}
          </p>
          <p className="sm:col-span-2">
            <b>Address</b>
            <br />
            {customer.address}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {policiesQuery.isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : policies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active policies found.</p>
          ) : (
            policies.map((policy) => (
              <div key={policy.id} className="flex items-center justify-between border-b pb-3 text-sm">
                <div>
                  <b>{policy.policyNumber}</b> · {policy.type}
                  <p className="text-muted-foreground">
                    {formatCurrency(policy.coverageAmount)} · {formatDate(policy.endDate)}
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/agent/policies/${policy.id}`}>View</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Claims</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {claimsQuery.isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : claims.length === 0 ? (
            <p className="text-sm text-muted-foreground">No claims submitted yet.</p>
          ) : (
            claims.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between gap-3 border-b pb-3 text-sm">
                <div>
                  <b>{claim.claimNumber}</b> · {claim.policyType ?? 'General Policy'}
                  <p className="text-muted-foreground">
                    {formatCurrency(claim.claimAmount)} · {formatDate(claim.submittedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ClaimStatusBadge status={claim.status} />
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/agent/claims/${claim.id}`}>Review</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

