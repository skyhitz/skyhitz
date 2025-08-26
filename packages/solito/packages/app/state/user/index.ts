import { User } from 'app/api/graphql/types'
import { create } from 'zustand'

interface UserState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  isAuthenticated: () => boolean
  userId: () => string | null
  userPublicKey: () => string | null
  userEmail: () => string | null
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  isAuthenticated: () => !!get().user,
  userId: () => get().user?.id || null,
  userPublicKey: () => get().user?.publicKey || null,
  userEmail: () => get().user?.email || null,
}))
