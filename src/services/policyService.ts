import { mockPolicies } from '@/mock'
import type { Policy } from '@/types'

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
