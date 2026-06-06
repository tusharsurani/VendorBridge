import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { generateInvoiceNumber, logActivity } from '@/lib/utils'
import type { POStatus, PurchaseOrder } from '@/types'
import toast from 'react-hot-toast'

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, vendor:vendors(company_name), rfq:rfqs(title, rfq_number)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as PurchaseOrder[]
    },
  })
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendor:vendors(*),
          rfq:rfqs(*),
          quotation:quotations(*, items:quotation_items(*))
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as PurchaseOrder
    },
    enabled: !!id,
  })
}

export function useUpdatePOStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, po_number }: { id: string; status: POStatus; po_number: string }) => {
      const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', id)
      if (error) throw error
      await logActivity(`marked as ${status}`, 'purchase_order', id, po_number)
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['purchase-order', vars.id] })
      toast.success(`PO marked as ${vars.status}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useGenerateInvoiceFromPO() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (po: PurchaseOrder) => {
      const { data: existing } = await supabase
        .from('invoices')
        .select('id')
        .eq('po_id', po.id)
        .maybeSingle()
      if (existing) throw new Error('Invoice already exists for this PO')

      const invoiceNumber = await generateInvoiceNumber()
      const taxAmount = po.cgst_amount + po.sgst_amount + po.igst_amount
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)

      const { data, error } = await supabase.from('invoices').insert({
        invoice_number: invoiceNumber,
        po_id: po.id,
        vendor_id: po.vendor_id,
        subtotal: po.subtotal,
        tax_amount: taxAmount,
        total_amount: po.total_amount,
        status: 'draft',
        due_date: dueDate.toISOString().split('T')[0],
      }).select().single()
      if (error) throw error
      await logActivity('generated', 'invoice', data.id, invoiceNumber)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice generated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useRecentPOs(limit = 5) {
  return useQuery({
    queryKey: ['purchase-orders', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, vendor:vendors(company_name), rfq:rfqs(rfq_number)')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as PurchaseOrder[]
    },
  })
}

export function useVendorPOs(vendorId: string, limit = 5) {
  return useQuery({
    queryKey: ['purchase-orders', 'vendor', vendorId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, rfq:rfqs(rfq_number, title)')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as PurchaseOrder[]
    },
    enabled: !!vendorId,
  })
}

export function usePOInvoice(poId: string) {
  return useQuery({
    queryKey: ['po-invoice', poId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number')
        .eq('po_id', poId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!poId,
  })
}

export function useMonthlySpend(months = 6) {
  return useQuery({
    queryKey: ['monthly-spend', months],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('total_amount, created_at')
        .order('created_at', { ascending: true })
      if (error) throw error

      const monthMap = new Map<string, number>()
      const now = new Date()
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
        monthMap.set(key, 0)
      }

      for (const po of data ?? []) {
        const d = new Date(po.created_at)
        const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
        if (monthMap.has(key)) {
          monthMap.set(key, (monthMap.get(key) ?? 0) + Number(po.total_amount))
        }
      }

      return Array.from(monthMap.entries()).map(([name, value]) => ({ name, value }))
    },
  })
}

export function usePOCount() {
  return useQuery({
    queryKey: ['po-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      return count ?? 0
    },
  })
}

export function useMonthlySpendTotal() {
  return useQuery({
    queryKey: ['monthly-spend-total'],
    queryFn: async () => {
      const start = new Date()
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('total_amount')
        .gte('created_at', start.toISOString())
      if (error) throw error
      return (data ?? []).reduce((sum, po) => sum + Number(po.total_amount), 0)
    },
  })
}
