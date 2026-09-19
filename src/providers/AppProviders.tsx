import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, useState, type ReactNode } from 'react'

import { PageLoadingSkeleton } from '@/components/layout/PagePlaceholder'
import { AuthProvider } from '@/providers/AuthProvider'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider><Suspense fallback={<PageLoadingSkeleton />}>{children}</Suspense></AuthProvider>
    </QueryClientProvider>
  )
}
