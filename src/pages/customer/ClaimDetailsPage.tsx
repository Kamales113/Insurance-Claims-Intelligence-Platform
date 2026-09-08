import { useParams } from 'react-router-dom'

import { PagePlaceholder } from '@/components/layout/PagePlaceholder'

export default function ClaimDetailsPage() {
  const { claimId } = useParams<{ claimId: string }>()

  return (
    <PagePlaceholder
      title="Claim Details"
      description={`Detailed view for claim ${claimId ?? ''}.`}
    />
  )
}
