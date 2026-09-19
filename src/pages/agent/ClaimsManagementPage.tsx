import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, Search, X } from 'lucide-react'

import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CLAIM_STATUSES } from '@/constants/claims'
import { getAgentClaims } from '@/services/claimsService'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function ClaimsManagementPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')

  const claimsQuery = useQuery({
    queryKey: ['claims', 'agent'],
    queryFn: getAgentClaims,
  })

  const { data: claims = [], isLoading, isError, refetch } = claimsQuery

  const types = useMemo(() => {
    return Array.from(new Set(claims.map((claim) => claim.policyType).filter(Boolean))) as string[]
  }, [claims])

  const filtered = useMemo(() => {
    return claims.filter((claim) => {
      const matchesStatus = status === 'all' || claim.status === status
      const matchesType = type === 'all' || claim.policyType === type
      const matchesQuery = `${claim.claimNumber} ${claim.customerName} ${claim.policyNumber}`
        .toLowerCase()
        .includes(query.toLowerCase())
      return matchesStatus && matchesType && matchesQuery
    })
  }, [claims, query, status, type])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Claims Management"
        description="Search, prioritize, and review claims across all customer portfolios."
      />
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <label className="relative">
              <span className="sr-only">Search claims</span>
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search claim, customer, or policy"
                className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
              />
            </label>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              {CLAIM_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by claim type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All claim types</option>
              {types.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setQuery('')
                setStatus('all')
                setType('all')
              }}
            >
              <X className="size-4" /> Clear
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {claims.length} claims
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertCircle className="size-7 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              Claims could not be loaded. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Claim</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Policy / Type</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Submitted</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((claim) => (
                    <tr key={claim.id} className="hover:bg-muted/30">
                      <td className="whitespace-nowrap px-5 py-4 font-medium">
                        {claim.claimNumber}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div>{claim.customerName}</div>
                        <div className="text-xs text-muted-foreground">{claim.customerEmail}</div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div>{claim.policyNumber}</div>
                        <div className="text-xs text-muted-foreground">{claim.policyType}</div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-medium">
                        {formatCurrency(claim.claimAmount)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        {formatDate(claim.submittedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <ClaimStatusBadge status={claim.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/agent/claims/${claim.id}`}>
                            Review <ArrowRight className="size-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No claims match the current filters.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

