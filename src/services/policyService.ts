import type { Policy } from '@/types'
import { api } from '@/services/api'

/** API-backed policies list for the authenticated customer. */
export async function getCurrentCustomerPolicies(): Promise<Policy[]> {
  return api.get<Policy[]>('/api/v1/policies')
}

export interface PolicyWithCustomer extends Policy { customerName: string; relatedClaimCount: number }

export async function getPoliciesByCustomerId(customerId: string): Promise<Policy[]> {
  return api.get<Policy[]>(`/api/v1/policies?customer_id=${encodeURIComponent(customerId)}`)
}

export async function getPolicyById(id: string): Promise<Policy | null> {
  try {
    return await api.get<Policy>(`/api/v1/policies/${encodeURIComponent(id)}`)
  } catch {
    return null
  }
}

export async function getPoliciesWithCustomers(): Promise<PolicyWithCustomer[]> {
  return api.get<PolicyWithCustomer[]>('/api/v1/policies')
}

export async function getPolicyWithCustomer(id: string): Promise<PolicyWithCustomer | null> {
  try {
    return await api.get<PolicyWithCustomer>(`/api/v1/policies/${encodeURIComponent(id)}`)
  } catch {
    return null
  }
}

