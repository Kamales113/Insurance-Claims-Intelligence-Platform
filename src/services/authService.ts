import { api, clearToken, setToken } from '@/services/api'
import type { User } from '@/types'

interface AuthResponse { user: User; token: string }

export async function getCurrentUser(): Promise<User | null> {
  return api.get<User>('/api/v1/auth/me')
}

export async function login(email: string, password: string): Promise<User> {
  try {
    const response = await api.post<AuthResponse>('/api/v1/auth/login', { email: email.trim(), password })
    setToken(response.token)
    return response.user
  } catch (error) {
    clearToken()
    if (error instanceof TypeError) throw new Error('Unable to connect to the server. Please try again.')
    throw new Error('Invalid email or password.')
  }
}

export async function logout(): Promise<void> {
  await api.post('/api/v1/auth/logout')
}
