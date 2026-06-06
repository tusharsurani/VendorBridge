import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  activeRoute: string
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setActiveRoute: (route: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeRoute: '/dashboard',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveRoute: (route) => set({ activeRoute: route }),
}))
