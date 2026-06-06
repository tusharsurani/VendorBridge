import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className={cn('transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-16')}>
        <Outlet />
      </div>
    </div>
  )
}
