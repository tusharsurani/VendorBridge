import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { VendorPerformance, ChartDataPoint } from '@/types'

export function useAnalytics() {
  const ytdSpend = useQuery({
    queryKey: ['analytics', 'ytd-spend'],
    queryFn: async () => {
      const start = new Date(new Date().getFullYear(), 0, 1).toISOString()
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('total_amount')
        .gte('created_at', start)
      if (error) throw error
      return (data ?? []).reduce((s, po) => s + Number(po.total_amount), 0)
    },
  })

  const totalPOs = useQuery({
    queryKey: ['analytics', 'total-pos'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      return count ?? 0
    },
  })

  const totalVendors = useQuery({
    queryKey: ['analytics', 'total-vendors'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
      if (error) throw error
      return count ?? 0
    },
  })

  const avgPOValue = useQuery({
    queryKey: ['analytics', 'avg-po'],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_orders').select('total_amount')
      if (error) throw error
      if (!data?.length) return 0
      const total = data.reduce((s, po) => s + Number(po.total_amount), 0)
      return total / data.length
    },
  })

  const monthlySpend12 = useQuery({
    queryKey: ['analytics', 'monthly-spend-12'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('total_amount, created_at')
      if (error) throw error

      const monthMap = new Map<string, number>()
      const now = new Date()
      for (let i = 11; i >= 0; i--) {
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
      return Array.from(monthMap.entries()).map(([name, value]) => ({ name, value })) as ChartDataPoint[]
    },
  })

  const vendorPerformance = useQuery({
    queryKey: ['analytics', 'vendor-performance'],
    queryFn: async () => {
      const [{ data: vendors }, { data: quotations }, { data: pos }] = await Promise.all([
        supabase.from('vendors').select('id, company_name').eq('status', 'active'),
        supabase.from('quotations').select('vendor_id, status, delivery_days'),
        supabase.from('purchase_orders').select('vendor_id, total_amount'),
      ])

      const performance: VendorPerformance[] = (vendors ?? []).map(v => {
        const vendorQuotes = (quotations ?? []).filter(q => q.vendor_id === v.id)
        const submitted = vendorQuotes.filter(q => q.status === 'submitted' || q.status === 'accepted').length
        const won = vendorQuotes.filter(q => q.status === 'accepted').length
        const deliveryDays = vendorQuotes.filter(q => q.delivery_days).map(q => q.delivery_days as number)
        const avgDelivery = deliveryDays.length ? deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length : 0
        const totalSpend = (pos ?? []).filter(p => p.vendor_id === v.id).reduce((s, p) => s + Number(p.total_amount), 0)

        return {
          vendor_id: v.id,
          company_name: v.company_name,
          quotes_submitted: submitted,
          quotes_won: won,
          win_rate: submitted ? (won / submitted) * 100 : 0,
          avg_delivery: Math.round(avgDelivery),
          total_spend: totalSpend,
        }
      })
      return performance.sort((a, b) => b.total_spend - a.total_spend)
    },
  })

  const topVendorsBySpend = useQuery({
    queryKey: ['analytics', 'top-vendors'],
    queryFn: async () => {
      const perf = vendorPerformance.data ?? []
      return perf.slice(0, 5).map(v => ({ name: v.company_name, value: v.total_spend })) as ChartDataPoint[]
    },
    enabled: !!vendorPerformance.data,
  })

  const activeRFQCount = useQuery({
    queryKey: ['analytics', 'active-rfqs'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
      if (error) throw error
      return count ?? 0
    },
  })

  return {
    ytdSpend,
    totalPOs,
    totalVendors,
    avgPOValue,
    monthlySpend12,
    vendorPerformance,
    topVendorsBySpend,
    activeRFQCount,
  }
}

export function usePendingApprovalsCount() {
  return useQuery({
    queryKey: ['analytics', 'pending-approvals'],
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
