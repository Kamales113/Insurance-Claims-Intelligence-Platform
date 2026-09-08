import { mockClaims, mockCustomers, mockPolicies, mockUsers } from '@/mock'
import type { Claim } from '@/types'

export interface ClaimWithPolicy extends Claim {
  policyType?: string
  policyNumber?: string
}

export interface CustomerClaimSummary {
  totalClaims: number
  activeClaims: number
  approvedClaims: number
  pendingClaims: number
}

export interface AgentClaimSummary {
  totalClaims: number
  pendingReview: number
  underInvestigation: number
  fraudAlerts: number
}

export interface AgentClaimWithCustomer extends ClaimWithPolicy {
  customerName: string
}

export async function getClaims(): Promise<Claim[]> {
  return Promise.resolve([...mockClaims])
}

export async function getClaimsByCustomerId(customerId: string): Promise<ClaimWithPolicy[]> {
  const claims = mockClaims.filter((c) => c.customerId === customerId)

  const claimsWithPolicies: ClaimWithPolicy[] = claims.map((claim) => {
    const policy = mockPolicies.find((p) => p.id === claim.policyId)
    return {
      ...claim,
      policyType: policy?.type ?? 'General Policy',
      policyNumber: policy?.policyNumber ?? 'N/A',
    }
  })

  // Sort by submitted date descending
  claimsWithPolicies.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )

  return Promise.resolve(claimsWithPolicies)
}

export async function getClaimById(id: string): Promise<Claim | null> {
  const claim = mockClaims.find((c) => c.id === id)
  return Promise.resolve(claim || null)
}

export async function getCustomerClaimSummary(
  customerId: string
): Promise<CustomerClaimSummary> {
  const customerClaims = mockClaims.filter((c) => c.customerId === customerId)

  const totalClaims = customerClaims.length

  // Active claims are open workflow states; APPROVAL remains active until payment.
  const activeClaims = customerClaims.filter(
    (c) => c.status !== 'PAID' && c.status !== 'REJECTED'
  ).length

  // Approved claims: claims that reached APPROVAL or PAID status
  const approvedClaims = customerClaims.filter(
    (c) => c.status === 'APPROVAL' || c.status === 'PAID'
  ).length

  // Pending claims exclude those already approved, paid, or rejected.
  const pendingClaims = customerClaims.filter((c) =>
    [
      'SUBMITTED',
      'DOCUMENT_VERIFICATION',
      'POLICY_VALIDATION',
      'UNDER_INVESTIGATION',
      'FRAUD_ASSESSMENT',
      'PAYMENT_PENDING',
    ].includes(c.status)
  ).length

  return Promise.resolve({
    totalClaims,
    activeClaims,
    approvedClaims,
    pendingClaims,
  })
}

export async function getAgentClaimSummary(): Promise<AgentClaimSummary> {
  return Promise.resolve({
    totalClaims: mockClaims.length,
    pendingReview: mockClaims.filter((claim) =>
      ['SUBMITTED', 'DOCUMENT_VERIFICATION', 'POLICY_VALIDATION'].includes(claim.status),
    ).length,
    underInvestigation: mockClaims.filter(
      (claim) => claim.status === 'UNDER_INVESTIGATION',
    ).length,
    fraudAlerts: mockClaims.filter(
      (claim) => claim.status === 'FRAUD_ASSESSMENT',
    ).length,
  })
}

export async function getClaimsRequiringAttention(): Promise<AgentClaimWithCustomer[]> {
  const attentionStatuses = [
    'SUBMITTED',
    'DOCUMENT_VERIFICATION',
    'POLICY_VALIDATION',
    'UNDER_INVESTIGATION',
    'FRAUD_ASSESSMENT',
  ]

  return Promise.resolve(
    mockClaims
      .filter((claim) => attentionStatuses.includes(claim.status))
      .map((claim) => {
        const policy = mockPolicies.find((candidate) => candidate.id === claim.policyId)
        const customer = mockCustomers.find((candidate) => candidate.id === claim.customerId)
        const user = mockUsers.find((candidate) => candidate.id === customer?.userId)

        return {
          ...claim,
          customerName: user ? `${user.firstName} ${user.lastName}` : 'Unknown customer',
          policyType: policy?.type ?? 'General Policy',
          policyNumber: policy?.policyNumber ?? 'N/A',
        }
      })
      .sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      ),
  )
}
