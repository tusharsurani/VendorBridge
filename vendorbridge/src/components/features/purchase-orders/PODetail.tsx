import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'
import type { PurchaseOrder } from '@/types'

interface PODetailProps {
  po: PurchaseOrder
}

export function PODetailView({ po }: PODetailProps) {
  const items = po.quotation?.items ?? []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-2xl">{po.po_number}</CardTitle>
            <p className="text-sm text-muted-foreground">Created: {formatDate(po.created_at)}</p>
          </div>
          <Badge className={cn('capitalize', getStatusColor(po.status))}>{po.status}</Badge>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Vendor</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{po.vendor?.company_name}</p>
            <p>{po.vendor?.contact_person}</p>
            <p>{po.vendor?.email}</p>
            <p>GST: {po.vendor?.gst_number}</p>
            <p>{po.vendor?.address}, {po.vendor?.city}, {po.vendor?.state}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Order Info</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>RFQ: {po.rfq?.rfq_number} — {po.rfq?.title}</p>
            <p>Payment Terms: {po.payment_terms}</p>
            {po.delivery_address && <p>Delivery: {po.delivery_address}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell>{formatCurrency(item.total_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(po.subtotal)}</span></div>
            <div className="flex justify-between"><span>CGST (9%)</span><span>{formatCurrency(po.cgst_amount)}</span></div>
            <div className="flex justify-between"><span>SGST (9%)</span><span>{formatCurrency(po.sgst_amount)}</span></div>
            {po.igst_amount > 0 && (
              <div className="flex justify-between"><span>IGST</span><span>{formatCurrency(po.igst_amount)}</span></div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total</span><span>{formatCurrency(po.total_amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
