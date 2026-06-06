import { useNavigate } from 'react-router-dom'
import { Eye, GitCompare, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { RFQStatusBadge } from './RFQStatusBadge'
import { useRFQs, useDeleteRFQ } from '@/hooks/useRFQs'
import { formatDate } from '@/lib/utils'

export function RFQTable() {
  const navigate = useNavigate()
  const { data: rfqs, isLoading } = useRFQs()
  const deleteRFQ = useDeleteRFQ()

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
  }

  if (!rfqs?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16">
        <FileText className="h-16 w-16 text-slate-300" />
        <p className="mt-4 text-lg font-medium text-navy">No RFQs yet</p>
        <p className="text-sm text-muted-foreground">Create your first Request for Quotation</p>
        <Button className="mt-4 bg-navy" onClick={() => navigate('/rfqs/create')}>+ Create RFQ</Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>RFQ#</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Vendors</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Quotes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rfqs.map(rfq => (
            <TableRow key={rfq.id}>
              <TableCell className="font-mono text-sm">{rfq.rfq_number}</TableCell>
              <TableCell className="font-medium">{rfq.title}</TableCell>
              <TableCell>{rfq.item_count}</TableCell>
              <TableCell>{rfq.vendor_count}</TableCell>
              <TableCell>{formatDate(rfq.deadline)}</TableCell>
              <TableCell><RFQStatusBadge status={rfq.status} /></TableCell>
              <TableCell>{rfq.quote_count}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/rfqs/${rfq.id}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {(rfq.quote_count ?? 0) > 0 && (
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/rfqs/${rfq.id}/compare`)}>
                      <GitCompare className="h-4 w-4" />
                    </Button>
                  )}
                  {rfq.status === 'draft' && (
                    <Button variant="ghost" size="icon" onClick={() => deleteRFQ.mutate({ id: rfq.id, rfq_number: rfq.rfq_number })}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
