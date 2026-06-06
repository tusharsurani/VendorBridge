import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/utils'
import type { Quotation, QuotationItem, QuotationStatus } from '@/types'
import toast from 'react-hot-toast'

export function useQuotationsByRFQ(rfqId: string) {
  return useQuery({
    queryKey: ['quotations', rfqId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, vendor:vendors(*), items:quotation_items(*)')
        .eq('rfq_id', rfqId)
        .eq('status', 'submitted')
      if (error) throw error
      return data as (Quotation & { items: QuotationItem[] })[]
    },
    enabled: !!rfqId,
  })
}

export function useQuotationByVendorRFQ(rfqId: string, vendorId: string) {
  return useQuery({
    queryKey: ['quotation', rfqId, vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, items:quotation_items(*)')
        .eq('rfq_id', rfqId)
        .eq('vendor_id', vendorId)
        .maybeSingle()
      if (error) throw error
      return data as (Quotation & { items: QuotationItem[] }) | null
    },
    enabled: !!rfqId && !!vendorId,
  })
}

interface QuotationInput {
  rfq_id: string
  vendor_id: string
  delivery_days?: number
  validity_days?: number
  notes?: string
  status: QuotationStatus
  items: { rfq_item_id: string; product_name: string; quantity: number; unit_price: number }[]
}

export function useSubmitQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: QuotationInput) => {
      const totalAmount = input.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)

      const existing = await supabase
        .from('quotations')
        .select('id')
        .eq('rfq_id', input.rfq_id)
        .eq('vendor_id', input.vendor_id)
        .maybeSingle()

      let quotationId: string

      if (existing.data) {
        const { data, error } = await supabase.from('quotations').update({
          total_amount: totalAmount,
          delivery_days: input.delivery_days,
          validity_days: input.validity_days ?? 30,
          notes: input.notes,
          status: input.status,
          submitted_at: input.status === 'submitted' ? new Date().toISOString() : null,
        }).eq('id', existing.data.id).select().single()
        if (error) throw error
        quotationId = data.id
        await supabase.from('quotation_items').delete().eq('quotation_id', quotationId)
      } else {
        const { data, error } = await supabase.from('quotations').insert({
          rfq_id: input.rfq_id,
          vendor_id: input.vendor_id,
          total_amount: totalAmount,
          delivery_days: input.delivery_days,
          validity_days: input.validity_days ?? 30,
          notes: input.notes,
          status: input.status,
          submitted_at: input.status === 'submitted' ? new Date().toISOString() : null,
        }).select().single()
        if (error) throw error
        quotationId = data.id
      }

      const quoteItems = input.items.map(item => ({
        quotation_id: quotationId,
        rfq_item_id: item.rfq_item_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))
      const { error: itemsError } = await supabase.from('quotation_items').insert(quoteItems)
      if (itemsError) throw itemsError

      await logActivity(
        input.status === 'submitted' ? 'submitted' : 'saved draft',
        'quotation',
        quotationId,
        `RFQ ${input.rfq_id}`
      )
      return quotationId
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['quotations', vars.rfq_id] })
      qc.invalidateQueries({ queryKey: ['quotation', vars.rfq_id, vars.vendor_id] })
      qc.invalidateQueries({ queryKey: ['rfq', vars.rfq_id] })
      toast.success(vars.status === 'submitted' ? 'Quotation submitted!' : 'Draft saved')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateQuotationStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, rfq_id }: { id: string; status: QuotationStatus; rfq_id: string }) => {
      const { error } = await supabase.from('quotations').update({ status }).eq('id', id)
      if (error) throw error
      await logActivity('status updated', 'quotation', id, status)
      return rfq_id
    },
    onSuccess: (rfqId) => {
      qc.invalidateQueries({ queryKey: ['quotations', rfqId] })
    },
  })
}
