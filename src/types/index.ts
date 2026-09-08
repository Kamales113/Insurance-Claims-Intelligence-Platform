import type { ClaimStatus, UserRole } from '@/constants/claims'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: string
}

export interface Customer {
  id: string
  userId: string
  phone: string
  address: string
  dateOfBirth: string
  createdAt: string
}

export interface Agent {
  id: string
  userId: string
  department: string
  employeeId: string
  createdAt: string
}

export interface Policy {
  id: string
  policyNumber: string
  customerId: string
  type: string
  status: 'active' | 'expired' | 'cancelled'
  startDate: string
  endDate: string
  coverageAmount: number
  premium: number
  createdAt: string
}

export interface ClaimDocument {
  id: string
  claimId: string
  fileName: string
  fileType: string
  uploadedAt: string
  uploadedBy: string
}

export interface ClaimStatusHistory {
  id: string
  claimId: string
  status: ClaimStatus
  changedAt: string
  changedBy: string
  notes?: string
}

export interface Claim {
  id: string
  claimNumber: string
  customerId: string
  policyId: string
  status: ClaimStatus
  incidentDate: string
  submittedAt: string
  description: string
  claimAmount: number
  assignedAgentId?: string
  updatedAt: string
}

export interface AuthSession {
  user: User
  token: string
}
