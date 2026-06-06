import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate, numberToWords, getStatusColor, cn } from '@/lib/utils'
import type { Invoice } from '@/types'

interface InvoiceDetailViewProps {
  invoice: Invoice
}

export function InvoiceDetailView({ invoice }: InvoiceDetailViewProps) {
  const items = invoice.purchase_order?.quotation?.items ?? []
  const cgst = invoice.tax_amount / 2
  const sgst = invoice.tax_amount / 2

  return (
    <div id="invoice-print" className="space-y-6">
      <Card className="overflow-hidden">
        <div className="bg-navy p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-display text-2xl font-bold">VendorBridge Corp</h2>
              <p className="text-sm text-white/70 mt-1">123 Business Park, Mumbai, Maharashtra</p>
              <p className="text-sm text-white/70">GSTIN: 27AABCV1234A1Z5</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">TAX INVOICE</p>
              <p className="text-sm">{invoice.invoice_number}</p>
              <Badge className={cn('mt-2 capitalize', getStatusColor(invoice.status))}>{invoice.status}</Badge>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bill To</p>
              <p className="font-medium">{invoice.vendor?.company_name}</p>
              <p className="text-sm">{invoice.vendor?.address}</p>
              <p className="text-sm">{invoice.vendor?.city}, {invoice.vendor?.state}</p>
              <p className="text-sm">GSTIN: {invoice.vendor?.gst_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm">Invoice Date: {formatDate(invoice.created_at)}</p>
              <p className="text-sm">Due Date: {invoice.due_date ? formatDate(invoice.due_date) : '—'}</p>
              <p className="text-sm">PO: {invoice.purchase_order?.po_number}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>HSN</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>9983</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between"><span>Taxable Value</span><span>{formatCurrency(invoice.subtotal)}</span></div>
              <div className="flex justify-between"><span>CGST @ 9%</span><span>{formatCurrency(cgst)}</span></div>
              <div className="flex justify-between"><span>SGST @ 9%</span><span>{formatCurrency(sgst)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Grand Total</span><span>{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <p className="font-medium">Amount in words:</p>
            <p className="italic">{numberToWords(invoice.total_amount)}</p>
          </div>

          <div className="text-sm text-muted-foreground border-t pt-4">
            <p>Payment Terms: Net 30</p>
            <p>Bank: HDFC Bank | A/C: 1234567890 | IFSC: HDFC0001234</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
