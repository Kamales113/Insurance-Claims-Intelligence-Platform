import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

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
const PolicyManagementPage = lazy(
  () => import('@/pages/agent/PolicyManagementPage'),
)

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: '/customer',
    element: <AppLayout role="customer" />,
    children: [
      { index: true, element: <CustomerDashboardPage /> },
      { path: 'claims', element: <CustomerClaimsPage /> },
      { path: 'claims/submit', element: <SubmitClaimPage /> },
      { path: 'claims/:claimId', element: <ClaimDetailsPage /> },
      { path: 'claims/:claimId/track', element: <ClaimTrackingPage /> },
      { path: 'policies', element: <CustomerPoliciesPage /> },
    ],
  },
  {
    path: '/agent',
    element: <AppLayout role="agent" />,
    children: [
      { index: true, element: <AgentDashboardPage /> },
      { path: 'claims', element: <ClaimsManagementPage /> },
      { path: 'claims/:claimId', element: <ClaimReviewPage /> },
      { path: 'customers', element: <CustomerManagementPage /> },
      { path: 'policies', element: <PolicyManagementPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]
