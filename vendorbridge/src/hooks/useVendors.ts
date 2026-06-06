import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/utils'
import type { Vendor, VendorFormData, VendorStatus } from '@/types'
import toast from 'react-hot-toast'

export function useVendors(filters?: { category?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['vendors', filters],
    queryFn: async () => {
      let query = supabase.from('vendors').select('*').order('created_at', { ascending: false })
      if (filters?.category) query = query.eq('category', filters.category)
      if (filters?.status) query = query.eq('status', filters.status as VendorStatus)
      const { data, error } = await query
      if (error) throw error
      let vendors = data as Vendor[]
      if (filters?.search) {
        const s = filters.search.toLowerCase()
        vendors = vendors.filter(v =>
          v.company_name.toLowerCase().includes(s) ||
          v.contact_person.toLowerCase().includes(s) ||
          v.email.toLowerCase().includes(s)
        )
      }
      return vendors
    },
  })
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('vendors').select('*').eq('id', id).single()
      if (error) throw error
      return data as Vendor
    },
    enabled: !!id,
  })
}

export function useVendorRFQs(vendorId: string) {
  return useQuery({
    queryKey: ['vendor-rfqs', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfq_vendors')
        .select('*, rfq:rfqs(*)')
        .eq('vendor_id', vendorId)
      if (error) throw error
      return data
    },
    enabled: !!vendorId,
  })
}

export function useVendorQuotations(vendorId: string) {
  return useQuery({
    queryKey: ['vendor-quotations', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, rfq:rfqs(title, rfq_number)')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!vendorId,
  })
}

export function useCreateVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vendor: VendorFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('vendors').insert({
        ...vendor,
        created_by: user?.id,
      }).select().single()
      if (error) throw error
      await logActivity('created', 'vendor', data.id, vendor.company_name)
      return data as Vendor
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor created successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...vendor }: VendorFormData & { id: string }) => {
      const { data, error } = await supabase.from('vendors')
        .update({ ...vendor, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
      if (error) throw error
      await logActivity('updated', 'vendor', id, vendor.company_name)
      return data as Vendor
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['vendors'] })
      qc.invalidateQueries({ queryKey: ['vendor', vars.id] })
      toast.success('Vendor updated successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useToggleVendorStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, company_name }: { id: string; status: VendorStatus; company_name: string }) => {
      const { error } = await supabase.from('vendors').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      await logActivity(status === 'active' ? 'activated' : 'deactivated', 'vendor', id, company_name)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor status updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
