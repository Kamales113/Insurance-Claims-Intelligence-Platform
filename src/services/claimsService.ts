import { mockClaimHistory, mockClaims, mockCustomers, mockPolicies, mockUsers } from '@/mock'
import type { Claim, ClaimStatusHistory } from '@/types'
import type { ClaimStatus } from '@/constants/claims'

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
  customerEmail: string
}

function enrichClaim(claim: Claim): AgentClaimWithCustomer {
  const policy = mockPolicies.find((candidate) => candidate.id === claim.policyId)
  const customer = mockCustomers.find((candidate) => candidate.id === claim.customerId)
  const user = mockUsers.find((candidate) => candidate.id === customer?.userId)
  return { ...claim, customerName: user ? `${user.firstName} ${user.lastName}` : 'Unknown customer', customerEmail: user?.email ?? '', policyType: policy?.type ?? 'General Policy', policyNumber: policy?.policyNumber ?? 'N/A' }
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

export async function getClaimsByPolicyId(policyId: string): Promise<AgentClaimWithCustomer[]> {
  return Promise.resolve(mockClaims.filter((claim) => claim.policyId === policyId).map(enrichClaim))
}

export async function getClaimById(id: string): Promise<Claim | null> {
  const claim = mockClaims.find((c) => c.id === id)
  return Promise.resolve(claim || null)
}

export async function getClaimHistory(claimId: string): Promise<ClaimStatusHistory[]> {
  return Promise.resolve(
    mockClaimHistory
      .filter((entry) => entry.claimId === claimId)
      .sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()),
  )
}

export async function updateClaimStatus(claimId: string, status: ClaimStatus, notes: string): Promise<Claim | null> {
  const claim = mockClaims.find((candidate) => candidate.id === claimId)
  if (!claim) return Promise.resolve(null)
  const now = new Date().toISOString()
  claim.status = status
  claim.updatedAt = now
  mockClaimHistory.push({ id: `hist_${crypto.randomUUID()}`, claimId, status, changedAt: now, changedBy: 'user_agent_001', notes })
  return Promise.resolve(claim)
}

export async function getAgentClaims(): Promise<AgentClaimWithCustomer[]> {
  return Promise.resolve(mockClaims.map(enrichClaim).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()))
}

export async function submitClaim(input: Omit<Claim, 'id' | 'claimNumber' | 'status' | 'submittedAt' | 'updatedAt'>): Promise<Claim> {
  const now = new Date().toISOString()
  const claim: Claim = {
    ...input,
    id: `clm_${crypto.randomUUID()}`,
    claimNumber: `CLM-${new Date().getFullYear()}-${String(mockClaims.length + 1).padStart(3, '0')}`,
    status: 'SUBMITTED',
    submittedAt: now,
    updatedAt: now,
  }
  mockClaims.push(claim)
  mockClaimHistory.push({
    id: `hist_${crypto.randomUUID()}`,
    claimId: claim.id,
    status: claim.status,
    changedAt: now,
    changedBy: input.customerId,
    notes: 'Initial claim submission by policyholder.',
  })
  return Promise.resolve(claim)
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
      .map(enrichClaim)
      .sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      ),
  )
}
