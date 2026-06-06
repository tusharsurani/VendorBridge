import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoices } from '@/hooks/useInvoices'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'

export function InvoicesPage() {
  const navigate = useNavigate()
  const { data: invoices, isLoading } = useInvoices()

  return (
    <div>
      <Header title="Invoices" subtitle="GST Invoices" />
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !invoices?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No invoices yet</p>
            <p className="text-sm mt-1">Generate invoices from purchase orders</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice#</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.vendor?.company_name ?? '—'}</TableCell>
                    <TableCell>{formatCurrency(inv.total_amount)}</TableCell>
                    <TableCell><Badge className={cn('capitalize', getStatusColor(inv.status))}>{inv.status}</Badge></TableCell>
                    <TableCell>{inv.due_date ? formatDate(inv.due_date) : '—'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/invoices/${inv.id}`)}>
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
