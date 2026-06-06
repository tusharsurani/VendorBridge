import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { generatePONumber, logActivity } from '@/lib/utils'
import { CGST_RATE, SGST_RATE } from '@/lib/constants'
import type { Approval, ApprovalStatus } from '@/types'
import toast from 'react-hot-toast'

export function useApprovals(status?: ApprovalStatus) {
  return useQuery({
    queryKey: ['approvals', status],
    queryFn: async () => {
      let query = supabase
        .from('approvals')
        .select(`
          *,
          rfq:rfqs(*),
          quotation:quotations(*, vendor:vendors(*), items:quotation_items(*))
        `)
        .order('requested_at', { ascending: false })
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (error) throw error
      return data as Approval[]
    },
  })
}

export function usePendingApprovalCount() {
  return useQuery({
    queryKey: ['approvals', 'pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('approvals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (error) throw error
      return count ?? 0
    },
  })
}

export function useCreateApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ rfq_id, quotation_id }: { rfq_id: string; quotation_id: string }) => {
      const { data: existing } = await supabase
        .from('approvals')
        .select('id')
        .eq('quotation_id', quotation_id)
        .eq('status', 'pending')
        .maybeSingle()
      if (existing) throw new Error('Approval already pending for this quotation')

      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('approvals').insert({
        rfq_id,
        quotation_id,
        approver_id: user?.id,
        status: 'pending',
      }).select().single()
      if (error) throw error
      await logActivity('requested', 'approval', data.id, `Quotation ${quotation_id}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] })
      toast.success('Approval request created')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useApproveApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ approval, remarks }: { approval: Approval; remarks?: string }) => {
      const quotation = approval.quotation
      if (!quotation) throw new Error('Quotation not found')

      const { error: approvalError } = await supabase.from('approvals').update({
        status: 'approved',
        remarks,
        decided_at: new Date().toISOString(),
      }).eq('id', approval.id)
      if (approvalError) throw approvalError

      const poNumber = await generatePONumber()
      const subtotal = quotation.total_amount
      const cgst = subtotal * CGST_RATE
      const sgst = subtotal * SGST_RATE
      const total = subtotal + cgst + sgst

      const { data: { user } } = await supabase.auth.getUser()
      const { data: po, error: poError } = await supabase.from('purchase_orders').insert({
        po_number: poNumber,
        rfq_id: approval.rfq_id,
        quotation_id: approval.quotation_id,
        vendor_id: quotation.vendor_id,
        subtotal,
        cgst_amount: cgst,
        sgst_amount: sgst,
        total_amount: total,
        status: 'draft',
        created_by: user?.id,
      }).select().single()
      if (poError) throw poError

      await Promise.all([
        supabase.from('quotations').update({ status: 'accepted' }).eq('id', quotation.id),
        supabase.from('quotations').update({ status: 'rejected' })
          .eq('rfq_id', approval.rfq_id!)
          .neq('id', quotation.id)
          .in('status', ['submitted', 'draft']),
        supabase.from('rfqs').update({ status: 'closed' }).eq('id', approval.rfq_id!),
      ])

      await logActivity('approved', 'approval', approval.id, poNumber, { po_id: po.id })
      return poNumber
    },
    onSuccess: (poNumber) => {
      qc.invalidateQueries({ queryKey: ['approvals'] })
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['rfqs'] })
      toast.success(`PO Generated: ${poNumber}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useRejectApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ approval, remarks }: { approval: Approval; remarks: string }) => {
      const { error } = await supabase.from('approvals').update({
        status: 'rejected',
        remarks,
        decided_at: new Date().toISOString(),
      }).eq('id', approval.id)
      if (error) throw error
      if (approval.quotation_id) {
        await supabase.from('quotations').update({ status: 'rejected' }).eq('id', approval.quotation_id)
      }
      await logActivity('rejected', 'approval', approval.id, remarks)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] })
      toast.success('Approval rejected')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
