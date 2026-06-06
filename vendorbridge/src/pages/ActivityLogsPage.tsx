import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Plus, Pencil, Trash2, Check, X, FileText, ShoppingCart, Receipt, Building2, Activity,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useActivityLogs } from '@/hooks/useActivityLogs'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

const actionIcons: Record<string, LucideIcon> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  approved: Check,
  rejected: X,
  published: FileText,
  submitted: FileText,
  generated: Receipt,
  vendor: Building2,
  default: Activity,
}

function getActionIcon(action: string, entityType: string): LucideIcon {
  if (actionIcons[action]) return actionIcons[action]
  if (entityType === 'purchase_order') return ShoppingCart
  if (entityType === 'invoice') return Receipt
  if (entityType === 'vendor') return Building2
  return Activity
}

const actionColors: Record<string, string> = {
  created: 'bg-green-100 text-green-600',
  updated: 'bg-blue-100 text-blue-600',
  deleted: 'bg-red-100 text-red-600',
  approved: 'bg-green-100 text-green-600',
  rejected: 'bg-red-100 text-red-600',
  published: 'bg-purple-100 text-purple-600',
  submitted: 'bg-yellow-100 text-yellow-600',
  default: 'bg-slate-100 text-slate-600',
}

export function ActivityLogsPage() {
  const [entityType, setEntityType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: logs, isLoading } = useActivityLogs({
    entityType: entityType || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  return (
    <div>
      <Header title="Activity Log" subtitle="Real-time audit trail" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div>
            <Label className="text-xs">Entity Type</Label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="rfq">RFQ</SelectItem>
                <SelectItem value="quotation">Quotation</SelectItem>
                <SelectItem value="approval">Approval</SelectItem>
                <SelectItem value="purchase_order">Purchase Order</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : !logs?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No activity logs yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs
              .filter(log => entityType === 'all' || !entityType || log.entity_type === entityType)
              .map(log => {
                const Icon = getActionIcon(log.action, log.entity_type)
                const colorClass = actionColors[log.action] ?? actionColors.default
                return (
                  <div key={log.id} className="flex items-start gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className={cn('rounded-full p-2', colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{log.user_name ?? 'System'}</span>
                        {' '}<span className="text-muted-foreground">{log.action}</span>
                        {' '}<span className="font-medium">{log.entity_type}</span>
                        {log.entity_label && <span className="text-navy"> — {log.entity_label}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
