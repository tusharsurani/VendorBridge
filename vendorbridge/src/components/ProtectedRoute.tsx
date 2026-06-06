import { Navigate, Outlet } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserRole } from '@/types'

export function ProtectedRoute() {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function PublicRoute() {
  const { user, loading } = useAuthStore()

  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { profile, loading } = useAuthStore()

  if (loading) return null

  const role = profile?.role
  if (!role) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Unable to load your profile permissions. Please sign out and try again.
      </div>
    )
  }

  if (!allowedRoles.includes(role)) {
    toast.error('You do not have access to this page')
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
