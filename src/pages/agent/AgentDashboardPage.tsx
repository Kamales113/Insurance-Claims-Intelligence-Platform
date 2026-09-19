import { type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, ClipboardList, FileText, Search, ShieldAlert, Users } from 'lucide-react'

import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge'
import { SummaryCard } from '@/components/dashboard/SummaryCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getAgentDashboardData } from '@/services/claimsService'
import { useAuth } from '@/providers/AuthProvider'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function AgentDashboardPage() {
  const { user } = useAuth()
  const dashboardQuery = useQuery({ queryKey: ['dashboard', 'agent'], queryFn: getAgentDashboardData })
  const { data, isLoading: loading, isError, refetch } = dashboardQuery
  const summary = data?.summary ?? { totalClaims: 0, pendingReview: 0, underInvestigation: 0, fraudAlerts: 0 }
  const claims = data?.claims ?? []

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{loading ? <Skeleton className="h-9 w-56" /> : `Good morning, ${user?.firstName ?? 'Alex'}`}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of claims, investigations, and policy activity.</p>
        </div>
        <Button asChild><Link to="/agent/claims"><ClipboardList className="size-4" /> Review Claims</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, index) => <Card key={index} className="p-6"><Skeleton className="mb-3 h-4 w-28" /><Skeleton className="h-8 w-12" /></Card>) : <>
          <SummaryCard title="Total Claims" value={summary.totalClaims} description="Across all customer portfolios" icon={<FileText className="size-5" />} />
          <SummaryCard title="Pending Review" value={summary.pendingReview} description="New or validation-stage claims" icon={<ClipboardList className="size-5 text-blue-600" />} valueClassName="text-blue-600" />
          <SummaryCard title="Under Investigation" value={summary.underInvestigation} description="Claims needing active review" icon={<Search className="size-5 text-amber-600" />} valueClassName="text-amber-600" />
          <SummaryCard title="Fraud Alerts" value={summary.fraudAlerts} description="Claims flagged for assessment" icon={<ShieldAlert className="size-5 text-rose-600" />} valueClassName="text-rose-600" />
        </>}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
          <div><CardTitle className="text-lg">Claims Requiring Attention</CardTitle><CardDescription className="mt-0.5 text-xs">Open claims prioritized for agent review and follow-up.</CardDescription></div>
          <Button asChild variant="ghost" size="sm"><Link to="/agent/claims">View all <ArrowRight className="size-3.5" /></Link></Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="space-y-4 p-6">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-8 w-full" />)}</div> : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center"><AlertCircle className="size-7 text-destructive" /><div><h3 className="font-semibold">Unable to load the claims queue</h3><p className="mt-1 text-sm text-muted-foreground">Please check your connection and try again.</p></div><Button variant="outline" onClick={() => void refetch()}>Try again</Button></div>
          ) : claims.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No claims currently require attention.</div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40 text-xs font-medium uppercase tracking-wider text-muted-foreground"><tr><th className="px-6 py-3.5">Claim Number</th><th className="px-6 py-3.5">Customer</th><th className="px-6 py-3.5">Policy / Claim Type</th><th className="px-6 py-3.5">Amount</th><th className="px-6 py-3.5">Submitted Date</th><th className="px-6 py-3.5">Status</th><th className="px-6 py-3.5 text-right">Action</th></tr></thead><tbody className="divide-y divide-border">
              {claims.map((claim) => <tr key={claim.id} className="group transition-colors hover:bg-muted/30"><td className="whitespace-nowrap px-6 py-4 font-medium">{claim.claimNumber}</td><td className="whitespace-nowrap px-6 py-4">{claim.customerName}</td><td className="whitespace-nowrap px-6 py-4 text-muted-foreground"><div className="font-medium text-foreground">{claim.policyType}</div><div className="text-xs">{claim.policyNumber}</div></td><td className="whitespace-nowrap px-6 py-4 font-semibold">{formatCurrency(claim.claimAmount)}</td><td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{formatDate(claim.submittedAt)}</td><td className="whitespace-nowrap px-6 py-4"><ClaimStatusBadge status={claim.status} /></td><td className="whitespace-nowrap px-6 py-4 text-right"><Button asChild variant="ghost" size="sm"><Link to={`/agent/claims/${claim.id}`}>Details <ArrowRight className="size-3.5" /></Link></Button></td></tr>)}
            </tbody></table></div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickAction icon={<ClipboardList className="size-5" />} title="Review Claims" description="Work through open claims and decisions." href="/agent/claims" />
        <QuickAction icon={<FileText className="size-5" />} title="Manage Policies" description="Review coverage and policy activity." href="/agent/policies" />
        <QuickAction icon={<Users className="size-5" />} title="View Customers" description="Access customer profiles and history." href="/agent/customers" />
      </div>
    </div>
  )
}

function QuickAction({ icon, title, description, href }: { icon: ReactNode; title: string; description: string; href: string }) {
  return <Card><CardContent className="flex items-start gap-4 p-5"><div className="rounded-lg bg-primary/10 p-2.5 text-primary">{icon}</div><div className="min-w-0"><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p><Button asChild variant="link" size="sm" className="mt-2 h-auto px-0"><Link to={href}>Open <ArrowRight className="size-3.5" /></Link></Button></div></CardContent></Card>
}
