import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, FilePlus, Inbox } from 'lucide-react'

import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrentCustomerClaims } from '@/services/claimsService'
import { formatCurrency, formatDate } from '@/utils/formatters'

export default function CustomerClaimsPage() {
  const claimsQuery = useQuery({
    queryKey: ['claims', 'customer'],
    queryFn: getCurrentCustomerClaims,
  })
  const claims = claimsQuery.data ?? []
  const loading = claimsQuery.isLoading

  return <div className="space-y-6">
    <PageHeader title="My Claims" description="View the status and details of your submitted insurance claims." actions={<Button asChild><Link to="/customer/claims/submit"><FilePlus className="size-4" /> Submit Claim</Link></Button>} />
    <Card><CardContent className="p-0">{loading ? <div className="space-y-4 p-6">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}</div> : claimsQuery.isError ? <div className="flex flex-col items-center gap-3 py-14 text-center"><AlertCircle className="size-9 text-destructive" /><div><h2 className="font-semibold">Unable to load claims</h2><p className="mt-1 text-sm text-muted-foreground">Please check your connection and try again.</p></div><Button variant="outline" onClick={() => void claimsQuery.refetch()}>Try again</Button></div> : claims.length === 0 ? <div className="py-14 text-center"><Inbox className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-semibold">No claims yet</h2><p className="mt-1 text-sm text-muted-foreground">When you submit a claim, you can track it here.</p></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-6 py-3.5">Claim</th><th className="px-6 py-3.5">Policy</th><th className="px-6 py-3.5">Amount</th><th className="px-6 py-3.5">Submitted</th><th className="px-6 py-3.5">Status</th><th className="px-6 py-3.5 text-right">Action</th></tr></thead><tbody className="divide-y divide-border">{claims.map((claim) => <tr key={claim.id} className="hover:bg-muted/30"><td className="whitespace-nowrap px-6 py-4 font-medium">{claim.claimNumber}</td><td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{claim.policyType}</td><td className="whitespace-nowrap px-6 py-4 font-semibold">{formatCurrency(claim.claimAmount)}</td><td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{formatDate(claim.submittedAt)}</td><td className="px-6 py-4"><ClaimStatusBadge status={claim.status} /></td><td className="px-6 py-4 text-right"><Button asChild variant="ghost" size="sm"><Link to={`/customer/claims/${claim.id}`}>Details <ArrowRight className="size-3.5" /></Link></Button></td></tr>)}</tbody></table></div>}</CardContent></Card>
  </div>
}
