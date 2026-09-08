import { mockUsers } from '@/mock'
import type { User } from '@/types'

const DEMO_USER_EMAILS = {
  customer: 'customer@demo.com',
  agent: 'agent@demo.com',
} as const

let activeUserId = 'user_cust_001'

export async function getCurrentUser(): Promise<User | null> {
  return Promise.resolve(mockUsers.find((user) => user.id === activeUserId) ?? null)
}

export async function login(email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase()
  const user =
    normalizedEmail === DEMO_USER_EMAILS.customer
      ? mockUsers.find((candidate) => candidate.role === 'customer')
      : normalizedEmail === DEMO_USER_EMAILS.agent
        ? mockUsers.find((candidate) => candidate.role === 'agent')
        : undefined

  if (!user || !password.trim()) {
    throw new Error('Invalid email or password')
  }

  // Simulate a network request while Phase 1 uses mock authentication.
  await new Promise((resolve) => window.setTimeout(resolve, 500))
  activeUserId = user.id

  return Promise.resolve(user)
}

export async function logout(): Promise<void> {
  activeUserId = 'user_cust_001'
  return Promise.resolve()
}
