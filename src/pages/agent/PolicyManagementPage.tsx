import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertCircle, Search, X } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getPoliciesWithCustomers } from '@/services/policyService'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function PolicyManagementPage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')

  const policiesQuery = useQuery({
    queryKey: ['policies', 'agent'],
    queryFn: getPoliciesWithCustomers,
  })

  const { data: policies = [], isLoading, isError, refetch } = policiesQuery

  const types = useMemo(() => {
    return Array.from(new Set(policies.map((policy) => policy.type).filter(Boolean))) as string[]
  }, [policies])

  const filtered = useMemo(() => {
    return policies.filter((policy) => {
      const matchesType = type === 'all' || policy.type === type
      const matchesStatus = status === 'all' || policy.status === status
      const matchesQuery = `${policy.policyNumber} ${policy.customerName}`
        .toLowerCase()
        .includes(query.toLowerCase())
      return matchesType && matchesStatus && matchesQuery
    })
  }, [policies, query, type, status])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy Management"
        description="Manage policies and coverage across customer portfolios."
      />
      <Card>
        <CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative">
            <span className="sr-only">Search policies</span>
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search policy or customer"
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
            />
          </label>
          <select
            aria-label="Policy type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All types</option>
            {types.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            aria-label="Policy status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button
            variant="outline"
            onClick={() => {
              setQuery('')
              setType('all')
              setStatus('all')
            }}
          >
            <X className="size-4" /> Clear
          </Button>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        {filtered.length} of {policies.length} policies
      </p>

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
              Policies could not be loaded. Please try again.
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
                    <th className="px-5 py-3">Policy</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Coverage</th>
                    <th className="px-5 py-3">Premium</th>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((policy) => (
                    <tr key={policy.id} className="hover:bg-muted/30">
                      <td className="whitespace-nowrap px-5 py-4 font-medium">
                        {policy.policyNumber}
                      </td>
                      <td className="px-5 py-4">{policy.customerName}</td>
                      <td className="px-5 py-4">{policy.type}</td>
                      <td className="px-5 py-4">{formatCurrency(policy.coverageAmount)}</td>
                      <td className="px-5 py-4">{formatCurrency(policy.premium)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs">
                        {formatDate(policy.startDate)} – {formatDate(policy.endDate)}
                      </td>
                      <td className="px-5 py-4 capitalize">{policy.status}</td>
                      <td className="px-5 py-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/agent/policies/${policy.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No policies match the current filters.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

