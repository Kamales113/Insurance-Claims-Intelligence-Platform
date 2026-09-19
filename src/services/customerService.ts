import { api } from '@/services/api'
import type { Customer, User } from '@/types'

export interface CustomerWithProfile extends Customer { user: User; policyCount: number; claimCount: number }

export async function getCustomersWithProfiles(): Promise<CustomerWithProfile[]> {
  return api.get<CustomerWithProfile[]>('/api/v1/customers')
}

export async function getCustomerWithProfile(id: string): Promise<CustomerWithProfile | null> {
  try {
    return await api.get<CustomerWithProfile>(`/api/v1/customers/${encodeURIComponent(id)}`)
  } catch {
    return null
  }
}

export async function getCurrentCustomer(): Promise<Customer | null> {
  try {
    return await api.get<Customer>('/api/v1/customers/me')
  } catch {
    return null
  }
}

