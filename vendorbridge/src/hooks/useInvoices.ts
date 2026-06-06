import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/utils'
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
