import { mockCustomers } from '@/mock'
import { getCurrentUser } from '@/services/authService'
import type { Customer } from '@/types'

export async function getCustomers(): Promise<Customer[]> {
  return Promise.resolve([...mockCustomers])
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customer = mockCustomers.find((c) => c.id === id)
  return Promise.resolve(customer || null)
}

export async function getCurrentCustomer(): Promise<Customer | null> {
  const user = await getCurrentUser()
  if (!user) return Promise.resolve(null)
  const customer = mockCustomers.find((c) => c.userId === user.id)
  return Promise.resolve(customer || null)
}
