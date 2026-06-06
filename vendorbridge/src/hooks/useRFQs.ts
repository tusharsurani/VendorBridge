import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { generateRFQNumber, logActivity } from '@/lib/utils'
import type { RFQ, RFQFormItem, RFQStatus, RFQWithDetails } from '@/types'
import toast from 'react-hot-toast'

export function useRFQs() {
  return useQuery({
    queryKey: ['rfqs'],
    queryFn: async () => {
      const { data: rfqs, error } = await supabase
        .from('rfqs')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error

      const enriched = await Promise.all((rfqs as RFQ[]).map(async (rfq) => {
        const [{ count: itemCount }, { count: vendorCount }, { count: quoteCount }] = await Promise.all([
          supabase.from('rfq_items').select('*', { count: 'exact', head: true }).eq('rfq_id', rfq.id),
          supabase.from('rfq_vendors').select('*', { count: 'exact', head: true }).eq('rfq_id', rfq.id),
          supabase.from('quotations').select('*', { count: 'exact', head: true }).eq('rfq_id', rfq.id).eq('status', 'submitted'),
        ])
        return { ...rfq, item_count: itemCount ?? 0, vendor_count: vendorCount ?? 0, quote_count: quoteCount ?? 0 }
      }))
      return enriched
    },
  })
}

export function useRFQ(id: string) {
  return useQuery({
    queryKey: ['rfq', id],
    queryFn: async () => {
      const { data: rfq, error } = await supabase.from('rfqs').select('*').eq('id', id).single()
      if (error) throw error

      const [{ data: items }, { data: vendors }, { data: quotations }] = await Promise.all([
        supabase.from('rfq_items').select('*').eq('rfq_id', id),
        supabase.from('rfq_vendors').select('*, vendor:vendors(*)').eq('rfq_id', id),
        supabase.from('quotations').select('*, vendor:vendors(*)').eq('rfq_id', id),
      ])

      return {
        ...rfq,
        items: items ?? [],
        vendors: vendors ?? [],
        quotations: quotations ?? [],
      } as RFQWithDetails
    },
    enabled: !!id,
  })
}

export function useCreateRFQ() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      title, description, deadline, status, items, vendorIds,
    }: {
      title: string
      description?: string
      deadline: string
      status: RFQStatus
      items: RFQFormItem[]
      vendorIds: string[]
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const rfqNumber = await generateRFQNumber()

      const { data: rfq, error } = await supabase.from('rfqs').insert({
        rfq_number: rfqNumber,
        title,
        description,
        deadline,
        status,
        created_by: user?.id,
      }).select().single()
      if (error) throw error

      const rfqItems = items.map(item => ({ ...item, rfq_id: rfq.id }))
      const { error: itemsError } = await supabase.from('rfq_items').insert(rfqItems)
      if (itemsError) throw itemsError

      const rfqVendors = vendorIds.map(vid => ({ rfq_id: rfq.id, vendor_id: vid }))
      const { error: vendorsError } = await supabase.from('rfq_vendors').insert(rfqVendors)
      if (vendorsError) throw vendorsError

      await logActivity(status === 'published' ? 'published' : 'created', 'rfq', rfq.id, rfqNumber)
      return rfq as RFQ
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rfqs'] })
      toast.success('RFQ saved successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteRFQ() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, rfq_number }: { id: string; rfq_number: string }) => {
      const { error } = await supabase.from('rfqs').delete().eq('id', id)
      if (error) throw error
      await logActivity('deleted', 'rfq', id, rfq_number)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rfqs'] })
      toast.success('RFQ deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useRecentRFQs(limit = 5) {
  return useQuery({
    queryKey: ['rfqs', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfqs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as RFQ[]
    },
  })
}
