import { mockClaims, mockCustomers, mockPolicies, mockUsers } from '@/mock'
import type { Policy } from '@/types'

export interface PolicyWithCustomer extends Policy { customerName: string; relatedClaimCount: number }

function enrich(policy: Policy): PolicyWithCustomer { const customer = mockCustomers.find((candidate) => candidate.id === policy.customerId); const user = mockUsers.find((candidate) => candidate.id === customer?.userId); return { ...policy, customerName: user ? `${user.firstName} ${user.lastName}` : 'Unknown customer', relatedClaimCount: mockClaims.filter((claim) => claim.policyId === policy.id).length } }

export async function getPolicies(): Promise<Policy[]> {
  return Promise.resolve([...mockPolicies])
}

export async function getPoliciesByCustomerId(customerId: string): Promise<Policy[]> {
  const policies = mockPolicies.filter((p) => p.customerId === customerId)
  return Promise.resolve(policies)
}

export async function getPolicyById(id: string): Promise<Policy | null> {
  const policy = mockPolicies.find((p) => p.id === id)
  return Promise.resolve(policy || null)
}

export async function getPoliciesWithCustomers(): Promise<PolicyWithCustomer[]> { return Promise.resolve(mockPolicies.map(enrich)) }
export async function getPolicyWithCustomer(id: string): Promise<PolicyWithCustomer | null> { const policy = mockPolicies.find((candidate) => candidate.id === id); return Promise.resolve(policy ? enrich(policy) : null) }
