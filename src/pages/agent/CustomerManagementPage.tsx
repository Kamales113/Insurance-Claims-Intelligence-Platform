import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertCircle, Search, X } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCustomersWithProfiles } from '@/services/customerService'

export default function CustomerManagementPage() {
  const [query, setQuery] = useState('')

  const customersQuery = useQuery({
    queryKey: ['customers', 'agent'],
    queryFn: getCustomersWithProfiles,
  })

  const { data: customers = [], isLoading, isError, refetch } = customersQuery

  const filtered = useMemo(() => {
    return customers.filter((customer) =>
      `${customer.user.firstName} ${customer.user.lastName} ${customer.user.email} ${customer.phone}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
  }, [customers, query])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Management"
        description="Find customer profiles, coverage, and claim activity."
      />
      <Card>
        <CardContent className="flex gap-3 p-5">
          <label className="relative flex-1">
            <span className="sr-only">Search customers</span>
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, or phone"
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
            />
          </label>
          <Button variant="outline" onClick={() => setQuery('')}>
            <X className="size-4" /> Clear
          </Button>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        {filtered.length} of {customers.length} customers
      </p>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertCircle className="size-7 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              Customers could not be loaded. Please try again.
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
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Policies</th>
                    <th className="px-5 py-3">Claims</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/30">
                      <td className="whitespace-nowrap px-5 py-4 font-medium">
                        {customer.user.firstName} {customer.user.lastName}
                      </td>
                      <td className="px-5 py-4">{customer.user.email}</td>
                      <td className="whitespace-nowrap px-5 py-4">{customer.phone}</td>
                      <td className="px-5 py-4">{customer.policyCount}</td>
                      <td className="px-5 py-4">{customer.claimCount}</td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-emerald-600">Active</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/agent/customers/${customer.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No customers match your search.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

