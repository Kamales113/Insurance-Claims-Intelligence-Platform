import { useParams } from 'react-router-dom'

import { PagePlaceholder } from '@/components/layout/PagePlaceholder'

export default function ClaimReviewPage() {
  const { claimId } = useParams<{ claimId: string }>()

  return (
    <PagePlaceholder
      title="Claim Review"
      description={`Review and process claim ${claimId ?? ''}.`}
    />
  )
}
