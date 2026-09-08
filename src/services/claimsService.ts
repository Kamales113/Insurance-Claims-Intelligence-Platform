import type { Claim } from '@/types'

export async function getClaims(): Promise<Claim[]> {
  throw new Error('claimsService.getClaims is not implemented yet')
}

export async function getClaimById(_id: string): Promise<Claim | null> {
  throw new Error('claimsService.getClaimById is not implemented yet')
}
