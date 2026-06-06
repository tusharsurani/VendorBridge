import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ActivityLog } from '@/types'

export function useActivityLogs(filters?: { entityType?: string; startDate?: string; endDate?: string }) {
  const qc = useQueryClient()
  const [realtimeLogs, setRealtimeLogs] = useState<ActivityLog[]>([])

  const query = useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: async () => {
      let q = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (filters?.entityType) q = q.eq('entity_type', filters.entityType)
      if (filters?.startDate) q = q.gte('created_at', filters.startDate)
      if (filters?.endDate) q = q.lte('created_at', filters.endDate + 'T23:59:59')
      const { data, error } = await q
      if (error) throw error
      return data as ActivityLog[]
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel('activity_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        const newLog = payload.new as ActivityLog
        setRealtimeLogs(prev => [newLog, ...prev].slice(0, 50))
        qc.invalidateQueries({ queryKey: ['activity-logs'] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [qc])

  const logs = [...realtimeLogs, ...(query.data ?? [])]
  const uniqueLogs = logs.filter((log, i, arr) => arr.findIndex(l => l.id === log.id) === i)

  return { ...query, data: uniqueLogs.slice(0, 50) }
}

export function useRecentActivity(limit = 5) {
  return useQuery({
    queryKey: ['activity-logs', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as ActivityLog[]
    },
  })
}
