import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { NotificationDropdown } from '@/components/layout/NotificationDropdown'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { profile, signOut } = useAuth()
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-slate-100/80 bg-white/95 px-6 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h2 className="font-display text-xl font-semibold text-navy tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground/80 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-teal/20">
                <AvatarFallback className="bg-navy text-white text-sm">
                  {profile?.full_name?.charAt(0) ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium text-navy md:inline">{profile?.full_name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => signOut()} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
