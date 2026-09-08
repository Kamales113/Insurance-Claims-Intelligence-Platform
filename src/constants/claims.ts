export const CLAIM_STATUSES = [
  'SUBMITTED',
  'DOCUMENT_VERIFICATION',
  'POLICY_VALIDATION',
  'UNDER_INVESTIGATION',
  'FRAUD_ASSESSMENT',
  'APPROVAL',
  'PAYMENT_PENDING',
  'PAID',
  'REJECTED',
] as const

export type ClaimStatus = (typeof CLAIM_STATUSES)[number]

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  SUBMITTED: 'Submitted',
  DOCUMENT_VERIFICATION: 'Document Verification',
  POLICY_VALIDATION: 'Policy Validation',
  UNDER_INVESTIGATION: 'Under Investigation',
  FRAUD_ASSESSMENT: 'Fraud Assessment',
  APPROVAL: 'Approval',
  PAYMENT_PENDING: 'Payment Pending',
  PAID: 'Paid',
  REJECTED: 'Rejected',
}

export const USER_ROLES = ['customer', 'agent', 'admin'] as const

export type UserRole = (typeof USER_ROLES)[number]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  agent: 'Agent',
  admin: 'Admin',
}
