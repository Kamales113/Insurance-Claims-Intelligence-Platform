import type { ClaimStatusHistory } from '@/types'

export const mockClaimHistory: ClaimStatusHistory[] = [
  {
    id: 'hist_001',
    claimId: 'clm_001',
    status: 'SUBMITTED',
    changedAt: '2026-08-28T10:15:00Z',
    changedBy: 'user_cust_001',
    notes: 'Initial claim submission by policyholder.',
  },
  {
    id: 'hist_002',
    claimId: 'clm_001',
    status: 'DOCUMENT_VERIFICATION',
    changedAt: '2026-08-29T09:00:00Z',
    changedBy: 'user_agent_001',
    notes: 'Reviewing photos of vehicle damage and police report.',
  },
  {
    id: 'hist_003',
    claimId: 'clm_001',
    status: 'UNDER_INVESTIGATION',
    changedAt: '2026-08-30T14:00:00Z',
    changedBy: 'user_agent_001',
    notes: 'Assigned to field adjuster for repair estimate verification.',
  },
  {
    id: 'hist_004',
    claimId: 'clm_002',
    status: 'SUBMITTED',
    changedAt: '2026-08-14T14:30:00Z',
    changedBy: 'user_cust_001',
    notes: 'Claim submitted with contractor estimate.',
  },
  {
    id: 'hist_005',
    claimId: 'clm_002',
    status: 'APPROVAL',
    changedAt: '2026-09-02T11:20:00Z',
    changedBy: 'user_agent_001',
    notes: 'Plumbing report verified. Claim approved for payout.',
  },
]
