import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KPICardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  trend?: string
}

export function KPICard({ label, value, icon: Icon, color, trend }: KPICardProps) {
  return (
    <Card className="border-slate-100 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-navy">{value}</p>
            {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
          </div>
          <div className={cn('rounded-xl p-3', color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
