import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, type ReactNode } from 'react'

import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '@/services/authService'
import { clearToken, getToken } from '@/services/api'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const sessionQuery = useQuery({
    queryKey: ['auth', 'current-user'],
    queryFn: getCurrentUser,
    enabled: Boolean(getToken()),
    retry: false,
  })

  if (sessionQuery.isError) clearToken()

  const user = sessionQuery.data ?? null
  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading: Boolean(getToken()) && sessionQuery.isLoading,
    async login(email, password) {
      const authenticatedUser = await loginRequest(email, password)
      queryClient.setQueryData(['auth', 'current-user'], authenticatedUser)
      return authenticatedUser
    },
    async logout() {
      // Start the optional server notification while the bearer token is still available.
      // Local logout must not depend on that request completing successfully.
      void logoutRequest().catch(() => undefined)

      await queryClient.cancelQueries({ queryKey: ['auth', 'current-user'] })
      clearToken()
      // localStorage updates are not reactive; publishing null makes guards and layouts
      // immediately observe the logged-out state.
      queryClient.setQueryData<User | null>(['auth', 'current-user'], null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
