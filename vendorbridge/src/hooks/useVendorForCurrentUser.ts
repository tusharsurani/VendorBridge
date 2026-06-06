import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useVendorForCurrentUser() {
  const { user, profile } = useAuthStore()

  return useQuery({
    queryKey: ['vendor-for-user', user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data: byUserId } = await supabase
        .from('vendors')
        .select('id, company_name, email')
        .eq('user_id', user.id)
        .maybeSingle()

      if (byUserId) return byUserId

      if (profile?.email) {
        const { data: byEmail } = await supabase
          .from('vendors')
          .select('id, company_name, email')
          .eq('email', profile.email)
          .maybeSingle()
        if (byEmail) {
          await supabase.from('vendors').update({ user_id: user.id }).eq('id', byEmail.id)
          return byEmail
        }
      }

      const { data: rpcId } = await supabase.rpc('get_vendor_id_for_user')
      if (rpcId) {
        const { data } = await supabase.from('vendors').select('id, company_name, email').eq('id', rpcId).single()
        return data
      }

      return null
    },
    enabled: !!user,
  })
}
