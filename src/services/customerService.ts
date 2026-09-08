import { mockClaims, mockCustomers, mockPolicies, mockUsers } from '@/mock'
import { getCurrentUser } from '@/services/authService'
import type { Customer, User } from '@/types'

export interface CustomerWithProfile extends Customer { user: User; policyCount: number; claimCount: number }

function enrich(customer: Customer): CustomerWithProfile | null {
  const user = mockUsers.find((candidate) => candidate.id === customer.userId)
  return user ? { ...customer, user, policyCount: mockPolicies.filter((policy) => policy.customerId === customer.id).length, claimCount: mockClaims.filter((claim) => claim.customerId === customer.id).length } : null
}

export async function getCustomers(): Promise<Customer[]> {
  return Promise.resolve([...mockCustomers])
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customer = mockCustomers.find((c) => c.id === id)
  return Promise.resolve(customer || null)
}

export async function getCustomersWithProfiles(): Promise<CustomerWithProfile[]> { return Promise.resolve(mockCustomers.map(enrich).filter((customer): customer is CustomerWithProfile => customer !== null)) }

export async function getCustomerWithProfile(id: string): Promise<CustomerWithProfile | null> { const customer = mockCustomers.find((candidate) => candidate.id === id); return Promise.resolve(customer ? enrich(customer) : null) }

export async function getCurrentCustomer(): Promise<Customer | null> {
  const user = await getCurrentUser()
  if (!user) return Promise.resolve(null)
  const customer = mockCustomers.find((c) => c.userId === user.id)
  return Promise.resolve(customer || null)
}
