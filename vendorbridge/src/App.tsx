import { Suspense, lazy, useEffect, type ReactNode } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute, PublicRoute, RoleRoute } from '@/components/ProtectedRoute'
import { ROLE_GROUPS } from '@/lib/roleGroups'

const AppLayout = lazy(() => import('@/components/layout/AppLayout').then(module => ({ default: module.AppLayout })))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(module => ({ default: module.LoginPage })))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage').then(module => ({ default: module.SignupPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const VendorsPage = lazy(() => import('@/pages/vendors/VendorsPage').then(module => ({ default: module.VendorsPage })))
const VendorDetailPage = lazy(() => import('@/pages/vendors/VendorDetailPage').then(module => ({ default: module.VendorDetailPage })))
const RFQsPage = lazy(() => import('@/pages/rfqs/RFQsPage').then(module => ({ default: module.RFQsPage })))
const CreateRFQPage = lazy(() => import('@/pages/rfqs/CreateRFQPage').then(module => ({ default: module.CreateRFQPage })))
const RFQDetailPage = lazy(() => import('@/pages/rfqs/RFQDetailPage').then(module => ({ default: module.RFQDetailPage })))
const QuotationComparePage = lazy(() => import('@/pages/rfqs/QuotationComparePage').then(module => ({ default: module.QuotationComparePage })))
const SubmitQuotationPage = lazy(() => import('@/pages/quotations/SubmitQuotationPage').then(module => ({ default: module.SubmitQuotationPage })))
const VendorQuotationsPage = lazy(() => import('@/pages/quotations/VendorQuotationsPage').then(module => ({ default: module.VendorQuotationsPage })))
const ApprovalsPage = lazy(() => import('@/pages/ApprovalsPage').then(module => ({ default: module.ApprovalsPage })))
const PurchaseOrdersPage = lazy(() => import('@/pages/purchase-orders/PurchaseOrdersPage').then(module => ({ default: module.PurchaseOrdersPage })))
const PODetailPage = lazy(() => import('@/pages/purchase-orders/PODetailPage').then(module => ({ default: module.PODetailPage })))
const InvoicesPage = lazy(() => import('@/pages/invoices/InvoicesPage').then(module => ({ default: module.InvoicesPage })))
const InvoiceDetailPage = lazy(() => import('@/pages/invoices/InvoiceDetailPage').then(module => ({ default: module.InvoiceDetailPage })))
const ActivityLogsPage = lazy(() => import('@/pages/ActivityLogsPage').then(module => ({ default: module.ActivityLogsPage })))
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then(module => ({ default: module.ReportsPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(module => ({ default: module.NotFoundPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { element: <RoleRoute allowedRoles={ROLE_GROUPS.all} />, children: [
            { path: '/dashboard', element: <DashboardPage /> },
          ]},
          { element: <RoleRoute allowedRoles={ROLE_GROUPS.officer} />, children: [
            { path: '/vendors', element: <VendorsPage /> },
            { path: '/vendors/:id', element: <VendorDetailPage /> },
            { path: '/rfqs', element: <RFQsPage /> },
            { path: '/rfqs/create', element: <CreateRFQPage /> },
            { path: '/rfqs/:id', element: <RFQDetailPage /> },
            { path: '/rfqs/:id/compare', element: <QuotationComparePage /> },
            { path: '/purchase-orders', element: <PurchaseOrdersPage /> },
            { path: '/purchase-orders/:id', element: <PODetailPage /> },
            { path: '/invoices', element: <InvoicesPage /> },
            { path: '/invoices/:id', element: <InvoiceDetailPage /> },
            { path: '/reports', element: <ReportsPage /> },
          ]},
          { element: <RoleRoute allowedRoles={ROLE_GROUPS.vendor} />, children: [
            { path: '/quotations', element: <VendorQuotationsPage /> },
            { path: '/quotations/submit/:rfqId', element: <SubmitQuotationPage /> },
            { path: '/purchase-orders/:id', element: <PODetailPage /> },
          ]},
          { element: <RoleRoute allowedRoles={ROLE_GROUPS.approver} />, children: [
            { path: '/approvals', element: <ApprovalsPage /> },
          ]},
          { element: <RoleRoute allowedRoles={ROLE_GROUPS.admin} />, children: [
            { path: '/activity', element: <ActivityLogsPage /> },
          ]},
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted-foreground">
      Loading...
    </div>
  )
}

function AppInitializer({ children }: { children: ReactNode }) {
  const initialize = useAuthStore(s => s.initialize)
  const cleanup = useAuthStore(s => s.cleanup)

  useEffect(() => {
    void initialize()
    return cleanup
  }, [initialize, cleanup])

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer>
        <Suspense fallback={<RouteFallback />}>
          <RouterProvider router={router} />
        </Suspense>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </AppInitializer>
    </QueryClientProvider>
  )
}
