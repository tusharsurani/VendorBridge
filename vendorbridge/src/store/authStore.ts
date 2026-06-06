import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  cleanup: () => void
  fetchProfile: (userId: string) => Promise<void>
}

let authSubscription: { unsubscribe: () => void } | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      set({ profile: null })
      return
    }

    set({ profile: data as Profile })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  initialize: async () => {
    authSubscription?.unsubscribe()
    authSubscription = null

    set({ loading: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      set({ user })
      await get().fetchProfile(user.id)
    }
    set({ loading: false })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      set({ user: currentUser })
      if (currentUser) {
        await get().fetchProfile(currentUser.id)
      } else {
        set({ profile: null })
      }
    })
    authSubscription = subscription
  },

  cleanup: () => {
    authSubscription?.unsubscribe()
    authSubscription = null
  },
}))
