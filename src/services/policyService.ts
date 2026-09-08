import type { Policy } from '@/types'

export async function getPolicies(): Promise<Policy[]> {
  throw new Error('policyService.getPolicies is not implemented yet')
}

export async function getPolicyById(_id: string): Promise<Policy | null> {
  throw new Error('policyService.getPolicyById is not implemented yet')
}
