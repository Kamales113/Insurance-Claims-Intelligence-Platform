import type { Customer } from '@/types'

export async function getCustomers(): Promise<Customer[]> {
  throw new Error('customerService.getCustomers is not implemented yet')
}

export async function getCustomerById(_id: string): Promise<Customer | null> {
  throw new Error('customerService.getCustomerById is not implemented yet')
}
