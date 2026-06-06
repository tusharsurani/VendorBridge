import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { generateInvoiceNumber, logActivity } from '@/lib/utils'
import type { Invoice, InvoiceStatus } from '@/types'
import toast from 'react-hot-toast'

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, vendor:vendors(company_name, email)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Invoice[]
    },
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          vendor:vendors(*),
          purchase_order:purchase_orders(*, quotation:quotations(*, items:quotation_items(*)))
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Invoice
    },
    enabled: !!id,
  })
}

export function useRecentInvoices(limit = 5) {
  return useQuery({
    queryKey: ['invoices', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, vendor:vendors(company_name)')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as Invoice[]
    },
  })
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, invoice_number }: { id: string; status: InvoiceStatus; invoice_number: string }) => {
      const updates: Partial<Invoice> = { status }
      if (status === 'paid') updates.paid_at = new Date().toISOString()
      const { error } = await supabase.from('invoices').update(updates).eq('id', id)
      if (error) throw error
      await logActivity(`marked as ${status}`, 'invoice', id, invoice_number)
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoice', vars.id] })
      qc.invalidateQueries({ queryKey: ['invoice-stats'] })
      toast.success('Invoice updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useSendInvoiceEmail() {
  return useMutation({
    mutationFn: async ({ invoiceId, invoiceNumber, to, cc, subject }: {
      invoiceId: string
      invoiceNumber: string
      to: string
      cc?: string
      subject: string
    }) => {
      await logActivity('email sent', 'invoice', invoiceId, invoiceNumber, { to, cc, subject })
    },
    onSuccess: () => toast.success('Email sent!'),
    onError: (e: Error) => toast.error(e.message),
  })
}

export interface CreateInvoiceInput {
  vendor_id: string
  subtotal: number
  tax_rate: number // percentage, e.g. 18
  due_date: string // YYYY-MM-DD
  notes?: string
  po_id?: string
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const invoiceNumber = await generateInvoiceNumber()
      const taxAmount = (input.subtotal * input.tax_rate) / 100
      const totalAmount = input.subtotal + taxAmount

      const { data, error } = await supabase.from('invoices').insert({
        invoice_number: invoiceNumber,
        vendor_id: input.vendor_id,
        po_id: input.po_id ?? null,
        subtotal: input.subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'draft' as InvoiceStatus,
        due_date: input.due_date,
        notes: input.notes ?? null,
      }).select('*, vendor:vendors(company_name, email)').single()

      if (error) throw error
      await logActivity('created', 'invoice', data.id, invoiceNumber)
      return data as Invoice
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoice-stats'] })
      toast.success('Invoice created successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, invoice_number }: { id: string; invoice_number: string }) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
      await logActivity('deleted', 'invoice', id, invoice_number)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoice-stats'] })
      toast.success('Invoice deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ['invoice-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('status, total_amount')
      if (error) throw error

      const stats = {
        total: data.length,
        draft: 0,
        sent: 0,
        paid: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
      }

      for (const inv of data) {
        const amount = Number(inv.total_amount)
        stats.totalAmount += amount
        if (inv.status === 'draft') {
          stats.draft++
          stats.pendingAmount += amount
        } else if (inv.status === 'sent') {
          stats.sent++
          stats.pendingAmount += amount
        } else if (inv.status === 'paid') {
          stats.paid++
          stats.paidAmount += amount
        }
      }

      return stats
    },
  })
}
