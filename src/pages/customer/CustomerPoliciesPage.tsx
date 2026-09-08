import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrentCustomer } from '@/services/customerService'
import { getPoliciesByCustomerId } from '@/services/policyService'
import type { Policy } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function CustomerPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const customer = await getCurrentCustomer()
        if (customer) {
          setPolicies(await getPoliciesByCustomerId(customer.id))
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Policies"
        description="Review your coverage, policy status, and renewal dates."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))
        ) : (
          policies.map((policy) => (
            <Card key={policy.id}>
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle>{policy.type}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{policy.policyNumber}</p>
                </div>
                <ShieldCheck className="size-5 text-emerald-600" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Coverage limit</p>
                  <p className="mt-1 text-lg font-semibold">{formatCurrency(policy.coverageAmount)}</p>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="capitalize font-medium text-emerald-600">{policy.status}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Renews</dt>
                    <dd className="font-medium">{formatDate(policy.endDate)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Annual premium</dt>
                    <dd className="font-medium">{formatCurrency(policy.premium)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
