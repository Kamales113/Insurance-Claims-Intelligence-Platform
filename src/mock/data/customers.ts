import type { Customer, User } from '@/types'

export const mockUsers: User[] = [
  {
    id: 'user_cust_001',
    email: 'sarah.jenkins@example.com',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    role: 'customer',
    createdAt: '2024-01-15T09:30:00Z',
  },
  {
    id: 'user_cust_002',
    email: 'michael.chen@example.com',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'customer',
    createdAt: '2024-02-20T11:15:00Z',
  },
  {
    id: 'user_cust_003',
    email: 'amanda.rodriguez@example.com',
    firstName: 'Amanda',
    lastName: 'Rodriguez',
    role: 'customer',
    createdAt: '2024-03-10T14:45:00Z',
  },
  {
    id: 'user_agent_001',
    email: 'david.miller@insurance.com',
    firstName: 'David',
    lastName: 'Miller',
    role: 'agent',
    createdAt: '2023-11-01T08:00:00Z',
  },
]

export const mockCustomers: Customer[] = [
  {
    id: 'cust_001',
    userId: 'user_cust_001',
    phone: '+1 (555) 234-5678',
    address: '742 Evergreen Terrace, Springfield, OR 97477',
    dateOfBirth: '1988-06-14',
    createdAt: '2024-01-15T09:30:00Z',
  },
  {
    id: 'cust_002',
    userId: 'user_cust_002',
    phone: '+1 (555) 876-5432',
    address: '1042 Market Street, San Francisco, CA 94103',
    dateOfBirth: '1982-11-03',
    createdAt: '2024-02-20T11:15:00Z',
  },
  {
    id: 'cust_003',
    userId: 'user_cust_003',
    phone: '+1 (555) 345-6789',
    address: '450 Ocean Drive, Miami, FL 33139',
    dateOfBirth: '1993-02-28',
    createdAt: '2024-03-10T14:45:00Z',
  },
]
