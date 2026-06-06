import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useApproveApproval, useRejectApproval } from '@/hooks/useApprovals'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'
import type { Approval } from '@/types'

interface ApprovalCardProps {
  approval: Approval
}

export function ApprovalCard({ approval }: ApprovalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [remarks, setRemarks] = useState('')

  const approve = useApproveApproval()
  const reject = useRejectApproval()

  const quotation = approval.quotation
  const vendor = quotation?.vendor

  const handleApprove = async () => {
    await approve.mutateAsync({ approval, remarks })
    setApproveOpen(false)
  }

  const handleReject = async () => {
    if (!remarks.trim()) return
    await reject.mutateAsync({ approval, remarks })
    setRejectOpen(false)
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-navy">{approval.rfq?.title ?? 'RFQ Approval'}</p>
            <Badge className={cn('capitalize', getStatusColor(approval.status))}>{approval.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Vendor: {vendor?.company_name} · Quote: {formatCurrency(quotation?.total_amount ?? 0)} ·
            Requested: {formatDate(approval.requested_at)}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              Requested {formatDate(approval.requested_at)}
            </Badge>
            {approval.decided_at && (
              <Badge variant="outline" className={cn('text-xs capitalize', getStatusColor(approval.status))}>
                {approval.status} {formatDate(approval.decided_at)}
              </Badge>
            )}
          </div>
          {approval.remarks && (approval.status === 'approved' || approval.status === 'rejected') && (
            <p className="text-sm mt-2 p-2 rounded bg-slate-50 border">
              <span className="font-medium">Remarks: </span>{approval.remarks}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {approval.status === 'pending' && (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setApproveOpen(true)}>
                <Check className="mr-1 h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>
                <X className="mr-1 h-4 w-4" /> Reject
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && quotation && (
        <div className="border-t p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Vendor Details</p>
              <p>{vendor?.contact_person}</p>
              <p>{vendor?.email}</p>
              <p>{vendor?.gst_number}</p>
            </div>
            <div>
              <p className="font-medium">Delivery & Validity</p>
              <p>Delivery: {quotation.delivery_days} days</p>
              <p>Validity: {quotation.validity_days} days</p>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(quotation.items ?? []).map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell>{formatCurrency(item.total_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve Quotation</DialogTitle></DialogHeader>
          <div>
            <Label>Approval Remarks</Label>
            <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Optional remarks..." />
          </div>
          <Button className="bg-green-600" onClick={handleApprove} disabled={approve.isPending}>
            Confirm Approval
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Quotation</DialogTitle></DialogHeader>
          <div>
            <Label>Rejection Reason *</Label>
            <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Reason for rejection..." />
          </div>
          <Button variant="destructive" onClick={handleReject} disabled={reject.isPending || !remarks.trim()}>
            Confirm Rejection
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
