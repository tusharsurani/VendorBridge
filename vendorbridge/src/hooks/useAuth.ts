import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'

export function useAuth() {
  const { user, profile, loading, signOut, fetchProfile } = useAuthStore()

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) await fetchProfile(data.user.id)
    return data
  }, [fetchProfile])

  const signup = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'procurement_officer'
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })
    if (error) throw error
    return data
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) throw error
  }, [])

  const getCurrentUser = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    return currentUser
  }, [])

  return { user, profile, loading, login, signup, signOut, resetPassword, getCurrentUser }
}
