import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { RequireRole } from '@/routes/RequireRole'
import { useAuth } from '@/providers/AuthProvider'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const AssistantPage = lazy(() => import('@/pages/assistant/AssistantPage'))

const CustomerDashboardPage = lazy(
  () => import('@/pages/customer/CustomerDashboardPage'),
)
const CustomerClaimsPage = lazy(
  () => import('@/pages/customer/CustomerClaimsPage'),
)
const SubmitClaimPage = lazy(() => import('@/pages/customer/SubmitClaimPage'))
const ClaimDetailsPage = lazy(() => import('@/pages/customer/ClaimDetailsPage'))
const ClaimTrackingPage = lazy(
  () => import('@/pages/customer/ClaimTrackingPage'),
)
const CustomerPoliciesPage = lazy(
  () => import('@/pages/customer/CustomerPoliciesPage'),
)

const AgentDashboardPage = lazy(
  () => import('@/pages/agent/AgentDashboardPage'),
)
const ClaimsManagementPage = lazy(
  () => import('@/pages/agent/ClaimsManagementPage'),
)
const ClaimReviewPage = lazy(() => import('@/pages/agent/ClaimReviewPage'))
const CustomerManagementPage = lazy(
  () => import('@/pages/agent/CustomerManagementPage'),
)
const AgentCustomerDetailsPage = lazy(
  () => import('@/pages/agent/AgentCustomerDetailsPage'),
)
const PolicyManagementPage = lazy(
  () => import('@/pages/agent/PolicyManagementPage'),
)
const AgentPolicyDetailsPage = lazy(
  () => import('@/pages/agent/AgentPolicyDetailsPage'),
)

function AssistantRedirect() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'customer' ? '/customer/assistant' : '/agent/assistant'} replace />
}

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: '/customer',
    element: <RequireRole role="customer"><AppLayout role="customer" /></RequireRole>,
    children: [
      { index: true, element: <CustomerDashboardPage /> },
      { path: 'claims', element: <CustomerClaimsPage /> },
      { path: 'claims/submit', element: <SubmitClaimPage /> },
      { path: 'claims/:claimId', element: <ClaimDetailsPage /> },
      { path: 'claims/:claimId/track', element: <ClaimTrackingPage /> },
      { path: 'policies', element: <CustomerPoliciesPage /> },
      { path: 'assistant', element: <AssistantPage /> },
    ],
  },
  {
    path: '/agent',
    element: <RequireRole role="agent"><AppLayout role="agent" /></RequireRole>,
    children: [
      { index: true, element: <AgentDashboardPage /> },
      { path: 'claims', element: <ClaimsManagementPage /> },
      { path: 'claims/:claimId', element: <ClaimReviewPage /> },
      { path: 'customers', element: <CustomerManagementPage /> },
      { path: 'customers/:customerId', element: <AgentCustomerDetailsPage /> },
      { path: 'policies', element: <PolicyManagementPage /> },
      { path: 'policies/:policyId', element: <AgentPolicyDetailsPage /> },
      { path: 'assistant', element: <AssistantPage /> },
    ],
  },
  {
    path: '/assistant',
    element: <AssistantRedirect />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]

