import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Building2, FileText, ClipboardList, CheckSquare,
  ShoppingCart, Receipt, Activity, BarChart3, ChevronLeft, ChevronRight, Link2,
} from 'lucide-react'
import { cn, getStatusColor } from '@/lib/utils'
import { APP_TAGLINE } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { usePendingApprovalCount } from '@/hooks/useApprovals'
import { Badge } from '@/components/ui/badge'
import type { NavItem, UserRole } from '@/types'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Vendors', href: '/vendors', icon: Building2, hideFor: ['vendor'] },
  { label: 'RFQs', href: '/rfqs', icon: FileText, hideFor: ['vendor'] },
  { label: 'Quotations', href: '/quotations', icon: ClipboardList, roles: ['vendor'] },
  { label: 'Approvals', href: '/approvals', icon: CheckSquare, roles: ['admin', 'manager'] },
  { label: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart, hideFor: ['vendor'] },
  { label: 'Invoices', href: '/invoices', icon: Receipt, hideFor: ['vendor'] },
  { label: 'Activity Log', href: '/activity', icon: Activity, roles: ['admin'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, hideFor: ['vendor'] },
]

function canSeeItem(role: UserRole, item: NavItem): boolean {
  if (item.roles) return item.roles.includes(role)
  if (item.hideFor) return !item.hideFor.includes(role)
  return true
}

const activeNavClass = 'bg-teal text-navy font-semibold'

export function Sidebar() {
  const { profile } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const location = useLocation()
  const { data: pendingCount = 0 } = usePendingApprovalCount()
  const role = profile?.role ?? 'procurement_officer'

  const visibleItems = navItems.filter(item => canSeeItem(role, item))

  return (
    <aside className={cn(
      'no-print fixed left-0 top-0 z-40 flex h-screen flex-col bg-navy text-white transition-all duration-300',
      sidebarOpen ? 'w-64' : 'w-16'
    )}>
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        {sidebarOpen ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal">
              <Link2 className="h-4 w-4 text-navy" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold leading-tight">VendorBridge</h1>
              <p className="text-[10px] text-white/50 leading-tight">{APP_TAGLINE}</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-teal">
            <Link2 className="h-4 w-4 text-navy" />
          </div>
        )}
        <button onClick={toggleSidebar} className="rounded p-1 hover:bg-white/10 shrink-0">
          {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map(item => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.href)
          const showBadge = item.href === '/approvals' && pendingCount > 0

          if (item.label === 'Quotations' && role === 'vendor') {
            return (
              <NavLink
                key={item.href}
                to="/quotations"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  location.pathname.startsWith('/quotations')
                    ? activeNavClass
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>Quotations</span>}
              </NavLink>
            )
          }

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive ? activeNavClass : 'text-white/80 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && (
                <span className="flex flex-1 items-center justify-between">
                  {item.label}
                  {showBadge && (
                    <Badge className="bg-red-500 text-white text-xs">{pendingCount}</Badge>
                  )}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {profile && (
        <div className="border-t border-white/10 p-4">
          {sidebarOpen ? (
            <div>
              <p className="truncate text-sm font-medium">{profile.full_name}</p>
              <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-xs capitalize', getStatusColor(profile.role))}>
                {profile.role.replace('_', ' ')}
              </span>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-teal text-navy text-sm font-bold">
              {profile.full_name.charAt(0)}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
