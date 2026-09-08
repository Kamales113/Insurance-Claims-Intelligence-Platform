import { useParams } from 'react-router-dom'

import { PagePlaceholder } from '@/components/layout/PagePlaceholder'

export default function ClaimTrackingPage() {
  const { claimId } = useParams<{ claimId: string }>()

  return (
    <PagePlaceholder
      title="Claim Tracking"
      description={`Track the lifecycle status for claim ${claimId ?? ''}.`}
    />
  )
}
