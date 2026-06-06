import { useNavigate } from 'react-router-dom'
import { Bell, Clock, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePendingApprovalCount } from '@/hooks/useApprovals'
import { useRecentActivity } from '@/hooks/useActivityLogs'
import { useAuthStore } from '@/store/authStore'
import { formatRelativeTime } from '@/lib/utils'
import type { ActivityLog } from '@/types'

function getEntityRoute(log: ActivityLog): string | null {
  if (!log.entity_id) return null
  const routes: Record<string, string> = {
    rfq: `/rfqs/${log.entity_id}`,
    quotation: '/quotations',
    approval: '/approvals',
    purchase_order: `/purchase-orders/${log.entity_id}`,
    invoice: `/invoices/${log.entity_id}`,
    vendor: `/vendors/${log.entity_id}`,
  }
  return routes[log.entity_type] ?? null
}

export function NotificationDropdown() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const isApprover = profile?.role === 'admin' || profile?.role === 'manager'
  const { data: pendingCount = 0 } = usePendingApprovalCount()
  const { data: recentActivity = [] } = useRecentActivity(5)

  const totalCount = (isApprover ? pendingCount : 0) + recentActivity.length

  const handleNavigate = (path: string | null) => {
    if (path) navigate(path)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-navy">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal text-[10px] font-medium text-navy">
              {Math.min(totalCount, 9)}{totalCount > 9 ? '+' : ''}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isApprover && pendingCount > 0 && (
          <>
            <DropdownMenuItem onClick={() => navigate('/approvals')} className="cursor-pointer">
              <Clock className="mr-2 h-4 w-4 text-teal" />
              <div>
                <p className="font-medium">{pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground">Review and approve quotations</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {recentActivity.length === 0 && (!isApprover || pendingCount === 0) ? (
          <div className="py-6 text-center text-sm text-muted-foreground">No recent activity</div>
        ) : (
          recentActivity.map(log => (
            <DropdownMenuItem
              key={log.id}
              onClick={() => handleNavigate(getEntityRoute(log))}
              className="cursor-pointer"
            >
              <Activity className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm truncate">
                  {log.user_name ?? 'System'} {log.action} {log.entity_label ?? log.entity_type}
                </p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(log.created_at)}</p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
