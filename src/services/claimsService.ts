import { mockClaims, mockCustomers, mockPolicies, mockUsers } from '@/mock'
import type { Claim, ClaimStatusHistory } from '@/types'
import type { ClaimStatus } from '@/constants/claims'
import { api } from '@/services/api'

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

export interface CustomerDashboardData {
  customerId: string
  summary: CustomerClaimSummary
  claims: ClaimWithPolicy[]
}

export interface AgentDashboardData {
  summary: AgentClaimSummary
  claims: AgentClaimWithCustomer[]
}

interface CurrentCustomerResponse { id: string }

/** API-backed data used only by the customer dashboard during this integration phase. */
export async function getCustomerDashboardData(): Promise<CustomerDashboardData> {
  const customer = await api.get<CurrentCustomerResponse>('/api/v1/customers/me')
  const [summary, claims] = await Promise.all([
    api.get<CustomerClaimSummary>(`/api/v1/customers/${customer.id}/summary`),
    api.get<ClaimWithPolicy[]>('/api/v1/claims'),
  ])
  return { customerId: customer.id, summary, claims }
}

/** API-backed data used only by the agent dashboard during this integration phase. */
export async function getAgentDashboardData(): Promise<AgentDashboardData> {
  const [summary, claims] = await Promise.all([
    api.get<AgentClaimSummary>('/api/v1/claims/summary'),
    api.get<AgentClaimWithCustomer[]>('/api/v1/claims?requiring_attention=true'),
  ])
  return { summary, claims }
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

/** API-backed claims list for the authenticated customer's My Claims page. */
export async function getCurrentCustomerClaims(): Promise<ClaimWithPolicy[]> {
  return api.get<ClaimWithPolicy[]>('/api/v1/claims')
}

/** API-backed claim detail used only by the customer Claim Details page. */
export async function getCurrentCustomerClaimDetails(claimId: string): Promise<Claim> {
  return api.get<Claim>(`/api/v1/claims/${encodeURIComponent(claimId)}`)
}

/** API-backed claim history used only by the customer Claim Details page. */
export async function getCurrentCustomerClaimHistory(claimId: string): Promise<ClaimStatusHistory[]> {
  return api.get<ClaimStatusHistory[]>(`/api/v1/claims/${encodeURIComponent(claimId)}/history`)
}

export async function getClaimsByCustomerId(customerId: string): Promise<ClaimWithPolicy[]> {
  return api.get<ClaimWithPolicy[]>(`/api/v1/claims?customer_id=${encodeURIComponent(customerId)}`)
}

export async function getClaimsByPolicyId(policyId: string): Promise<AgentClaimWithCustomer[]> {
  return api.get<AgentClaimWithCustomer[]>(`/api/v1/claims?policy_id=${encodeURIComponent(policyId)}`)
}

export async function getClaimById(id: string): Promise<Claim | null> {
  try {
    return await api.get<Claim>(`/api/v1/claims/${encodeURIComponent(id)}`)
  } catch {
    return null
  }
}

export async function getClaimHistory(claimId: string): Promise<ClaimStatusHistory[]> {
  return api.get<ClaimStatusHistory[]>(`/api/v1/claims/${encodeURIComponent(claimId)}/history`)
}

export async function updateClaimStatus(claimId: string, status: ClaimStatus, notes?: string): Promise<Claim> {
  return api.patch<Claim>(`/api/v1/claims/${encodeURIComponent(claimId)}/status`, { status, notes })
}

export async function getAgentClaims(): Promise<AgentClaimWithCustomer[]> {
  return api.get<AgentClaimWithCustomer[]>('/api/v1/claims')
}


export interface SubmitClaimInput {
  policyId: string
  incidentDate: string
  description: string
  claimAmount: number
}

/** API-backed claim submission for the authenticated customer. */
export async function submitClaim(input: SubmitClaimInput): Promise<Claim> {
  return api.post<Claim>('/api/v1/claims', input)
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
