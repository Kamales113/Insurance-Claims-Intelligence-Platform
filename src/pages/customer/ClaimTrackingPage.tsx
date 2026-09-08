import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getClaimById, getClaimHistory } from '@/services/claimsService'
import type { Claim, ClaimStatusHistory } from '@/types'
import { formatDate } from '@/utils/formatters'

export default function ClaimTrackingPage() {
  const { claimId } = useParams<{ claimId: string }>(); const [claim, setClaim] = useState<Claim | null>(null); const [history, setHistory] = useState<ClaimStatusHistory[]>([])
  useEffect(() => { void (async () => { if (!claimId) return; setClaim(await getClaimById(claimId)); setHistory(await getClaimHistory(claimId)) })() }, [claimId])
  return <div className="space-y-6"><PageHeader title="Claim Tracking" description={claim ? `Follow the progress of ${claim.claimNumber}.` : 'Loading claim progress…'} actions={<Button asChild variant="outline"><Link to={`/customer/claims/${claimId}`}><ArrowLeft className="size-4" /> Claim details</Link></Button>} /><Card><CardContent className="p-6">{history.length === 0 ? <p className="text-sm text-muted-foreground">No status updates are available yet.</p> : <ol className="space-y-6">{history.map((item, index) => <li key={item.id} className="flex gap-4"><div className="flex flex-col items-center"><CheckCircle2 className="size-5 text-primary" />{index < history.length - 1 && <div className="mt-2 h-full w-px bg-border" />}</div><div className="min-w-0 pb-2"><div className="flex flex-wrap items-center gap-2"><ClaimStatusBadge status={item.status} /><span className="text-sm text-muted-foreground">{formatDate(item.changedAt)}</span></div><p className="mt-2 text-sm text-muted-foreground">{item.notes ?? 'Status updated.'}</p></div></li>)}</ol>}</CardContent></Card></div>
}
