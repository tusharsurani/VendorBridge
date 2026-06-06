import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuotationsByRFQ } from '@/hooks/useQuotations'
import { useCreateApproval } from '@/hooks/useApprovals'
import { formatCurrency, cn } from '@/lib/utils'
import type { Quotation, QuotationItem } from '@/types'
import toast from 'react-hot-toast'

interface QuotationCompareProps {
  rfqId: string
}

type SortOption = 'price' | 'delivery' | 'rating'
type FilterOption = 'all' | 'top3'

export function QuotationCompare({ rfqId }: QuotationCompareProps) {
  const navigate = useNavigate()
  const { data: quotations, isLoading } = useQuotationsByRFQ(rfqId)
  const createApproval = useCreateApproval()
  const [sortBy, setSortBy] = useState<SortOption>('price')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')

  const sortedVendors = useMemo(() => {
    if (!quotations?.length) return []
    const sorted = [...quotations].sort((a, b) => {
      if (sortBy === 'price') return a.total_amount - b.total_amount
      if (sortBy === 'delivery') return (a.delivery_days ?? 999) - (b.delivery_days ?? 999)
      return (b.vendor?.rating ?? 0) - (a.vendor?.rating ?? 0)
    })
    return filterBy === 'top3' ? sorted.slice(0, 3) : sorted
  }, [quotations, sortBy, filterBy])

  const comparisonData = useMemo(() => {
    if (!sortedVendors.length) return { items: [], vendors: [] }

    const itemMap = new Map<string, { product_name: string; prices: Record<string, number> }>()
    for (const quote of sortedVendors) {
      for (const item of (quote.items ?? []) as QuotationItem[]) {
        const key = item.rfq_item_id ?? item.product_name
        if (!itemMap.has(key)) {
          itemMap.set(key, { product_name: item.product_name, prices: {} })
        }
        itemMap.get(key)!.prices[quote.vendor_id] = item.unit_price
      }
    }

    return {
      items: Array.from(itemMap.entries()).map(([id, data]) => ({
        id,
        ...data,
        lowestVendorId: Object.entries(data.prices).reduce((min, [vid, price]) =>
          price < (data.prices[min] ?? Infinity) ? vid : min,
          Object.keys(data.prices)[0]
        ),
      })),
      vendors: sortedVendors,
    }
  }, [sortedVendors])

  const handleSelectVendor = async (quotation: Quotation) => {
    try {
      await createApproval.mutateAsync({ rfq_id: rfqId, quotation_id: quotation.id })
      navigate('/approvals')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />

  if (!quotations?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No submitted quotations to compare yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="price">Lowest Total Price</SelectItem>
            <SelectItem value="delivery">Fastest Delivery</SelectItem>
            <SelectItem value="rating">Highest Rating</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBy} onValueChange={v => setFilterBy(v as FilterOption)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Show All Vendors</SelectItem>
            <SelectItem value="top3">Top 3 by Sort</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Item</TableHead>
              {comparisonData.vendors.map(q => (
                <TableHead key={q.id} className="text-center min-w-[140px]">
                  {q.vendor?.company_name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisonData.items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.product_name}</TableCell>
                {comparisonData.vendors.map(q => (
                  <TableCell
                    key={q.id}
                    className={cn(
                      'text-center',
                      item.lowestVendorId === q.vendor_id && 'bg-green-50 font-semibold text-green-700'
                    )}
                  >
                    {item.prices[q.vendor_id] != null
                      ? formatCurrency(item.prices[q.vendor_id])
                      : '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow className="bg-slate-50 font-semibold">
              <TableCell>Total Quote</TableCell>
              {comparisonData.vendors.map(q => (
                <TableCell key={q.id} className="text-center">{formatCurrency(q.total_amount)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>Delivery Days</TableCell>
              {comparisonData.vendors.map(q => (
                <TableCell key={q.id} className="text-center">{q.delivery_days ?? '—'} days</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>Validity</TableCell>
              {comparisonData.vendors.map(q => (
                <TableCell key={q.id} className="text-center">{q.validity_days} days</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>Rating</TableCell>
              {comparisonData.vendors.map(q => (
                <TableCell key={q.id} className="text-center">
                  <span className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-teal text-teal" />
                    {q.vendor?.rating ?? '—'}
                  </span>
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell></TableCell>
              {comparisonData.vendors.map(q => (
                <TableCell key={q.id} className="text-center">
                  <Button
                    size="sm"
                    className="bg-navy hover:bg-navy-600"
                    onClick={() => handleSelectVendor(q)}
                    disabled={createApproval.isPending}
                  >
                    Select this Vendor
                  </Button>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
