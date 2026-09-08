import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FilePlus,
  FileText,
  Inbox,
  ShieldCheck,
} from 'lucide-react'

import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge'
import { SummaryCard } from '@/components/dashboard/SummaryCard'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrentUser } from '@/services/authService'
import {
  type ClaimWithPolicy,
  type CustomerClaimSummary,
  getClaimsByCustomerId,
  getCustomerClaimSummary,
} from '@/services/claimsService'
import { getCurrentCustomer } from '@/services/customerService'
import type { Customer, User } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function CustomerDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [_customer, setCustomer] = useState<Customer | null>(null)
  const [summary, setSummary] = useState<CustomerClaimSummary>({
    totalClaims: 0,
    activeClaims: 0,
    approvedClaims: 0,
    pendingClaims: 0,
  })
  const [claims, setClaims] = useState<ClaimWithPolicy[]>([])

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)
        const currentUser = await getCurrentUser()
        setUser(currentUser)

        const currentCustomer = await getCurrentCustomer()
        setCustomer(currentCustomer)

        if (currentCustomer) {
          const [summaryData, claimsData] = await Promise.all([
            getCustomerClaimSummary(currentCustomer.id),
            getClaimsByCustomerId(currentCustomer.id),
          ])
          setSummary(summaryData)
          setClaims(claimsData)
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadDashboardData()
  }, [])

  return (
    <div className="space-y-8">
      {/* Page Title and Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-foreground">
            {loading ? (
              <Skeleton className="h-9 w-64" />
            ) : (
              `Welcome back, ${user?.firstName || 'Valued Customer'}!`
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your insurance claims, active policies, and recent activity.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="default" className="shadow-xs">
            <Link to="/customer/claims/submit">
              <FilePlus className="size-4 mr-2" />
              Submit Claim
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link to="/customer/policies">
              <ShieldCheck className="size-4 mr-2" />
              View Policies
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </Card>
          ))
        ) : (
          <>
            <SummaryCard
              title="Total Claims"
              value={summary.totalClaims}
              description="All-time submitted claims"
              icon={<FileText className="size-5" />}
            />
            <SummaryCard
              title="Active Claims"
              value={summary.activeClaims}
              description="In review or processing"
              icon={<Clock className="size-5" />}
            />
            <SummaryCard
              title="Approved Claims"
              value={summary.approvedClaims}
              description="Approved or paid out"
              icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
              valueClassName="text-emerald-600 dark:text-emerald-400"
            />
            <SummaryCard
              title="Pending Claims"
              value={summary.pendingClaims}
              description="Awaiting documentation or decision"
              icon={<AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />}
              valueClassName="text-amber-600 dark:text-amber-400"
            />
          </>
        )}
      </div>

      {/* Recent Claims Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
          <div>
            <CardTitle className="text-lg font-semibold">Recent Claims</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Review status, amounts, and details of your submitted claims.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ))}
            </div>
          ) : claims.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
                <Inbox className="size-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No claims found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                You haven't submitted any insurance claims yet. If you need to report an incident, click below.
              </p>
              <Button asChild variant="default" className="mt-4">
                <Link to="/customer/claims/submit">
                  <FilePlus className="size-4 mr-2" />
                  Submit Your First Claim
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">
                      Claim Number
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Policy / Claim Type
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Submitted Date
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {claims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="transition-colors hover:bg-muted/30 group"
                    >
                      <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                        {claim.claimNumber}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        <div className="font-medium text-foreground text-xs md:text-sm">
                          {claim.policyType}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {claim.policyNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                        {formatCurrency(claim.claimAmount)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(claim.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ClaimStatusBadge status={claim.status} />
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="opacity-90 group-hover:opacity-100"
                        >
                          <Link to={`/customer/claims/${claim.id}`}>
                            Details
                            <ArrowRight className="size-3.5 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
