import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSubmitQuotation } from '@/hooks/useQuotations'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { RFQItem, Quotation, QuotationItem } from '@/types'

interface QuotationFormProps {
  rfqId: string
  vendorId: string
  rfqTitle: string
  rfqDescription?: string | null
  deadline: string
  items: RFQItem[]
  existing?: (Quotation & { items: QuotationItem[] }) | null
}

export function QuotationForm({
  rfqId, vendorId, rfqTitle, rfqDescription, deadline, items, existing,
}: QuotationFormProps) {
  const submitQuotation = useSubmitQuotation()
  const isReadOnly = existing?.status === 'submitted'

  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    existing?.items?.forEach(item => {
      if (item.rfq_item_id) map[item.rfq_item_id] = item.unit_price
    })
    return map
  })
  const [deliveryDays, setDeliveryDays] = useState(existing?.delivery_days ?? 7)
  const [validityDays, setValidityDays] = useState(existing?.validity_days ?? 30)
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const getTotal = (item: RFQItem) => (prices[item.id] ?? 0) * item.quantity
  const grandTotal = items.reduce((sum, item) => sum + getTotal(item), 0)

  const buildItems = () => items.map(item => ({
    rfq_item_id: item.id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: prices[item.id] ?? 0,
  }))

  const handleSave = (status: 'draft' | 'submitted') => {
    submitQuotation.mutate({
      rfq_id: rfqId,
      vendor_id: vendorId,
      delivery_days: deliveryDays,
      validity_days: validityDays,
      notes,
      status,
      items: buildItems(),
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{rfqTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">Deadline: {formatDate(deadline)}</p>
        </CardHeader>
        {rfqDescription && (
          <CardContent><p className="text-sm">{rfqDescription}</p></CardContent>
        )}
      </Card>

      {isReadOnly && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
          ✓ Quotation submitted successfully. Awaiting review.
        </div>
      )}

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Unit Price (₹)</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.product_name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={prices[item.id] ?? ''}
                    onChange={e => setPrices(p => ({ ...p, [item.id]: parseFloat(e.target.value) || 0 }))}
                    disabled={isReadOnly}
                    className="w-32"
                  />
                </TableCell>
                <TableCell>{formatCurrency(getTotal(item))}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold bg-slate-50">
              <TableCell colSpan={4}>Grand Total</TableCell>
              <TableCell>{formatCurrency(grandTotal)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Delivery Days</Label>
          <Input type="number" value={deliveryDays} onChange={e => setDeliveryDays(+e.target.value)} disabled={isReadOnly} />
        </div>
        <div>
          <Label>Validity Days</Label>
          <Input type="number" value={validityDays} onChange={e => setValidityDays(+e.target.value)} disabled={isReadOnly} />
        </div>
        <div className="col-span-3">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={isReadOnly} rows={3} />
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={submitQuotation.isPending}>
            Save Draft
          </Button>
          <Button className="bg-navy" onClick={() => handleSave('submitted')} disabled={submitQuotation.isPending}>
            Submit Quotation
          </Button>
        </div>
      )}
    </div>
  )
}
