import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'

export function PurchaseOrdersPage() {
  const navigate = useNavigate()
  const { data: orders, isLoading } = usePurchaseOrders()

  return (
    <div>
      <Header title="Purchase Orders" subtitle="Manage POs" />
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !orders?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No purchase orders yet</p>
            <p className="text-sm mt-1">POs are generated when approvals are confirmed</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO#</TableHead>
                  <TableHead>RFQ</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(po => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-sm">{po.po_number}</TableCell>
                    <TableCell>{po.rfq?.rfq_number ?? '—'}</TableCell>
                    <TableCell>{po.vendor?.company_name ?? '—'}</TableCell>
                    <TableCell>{formatCurrency(po.total_amount)}</TableCell>
                    <TableCell><Badge className={cn('capitalize', getStatusColor(po.status))}>{po.status}</Badge></TableCell>
                    <TableCell>{formatDate(po.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
