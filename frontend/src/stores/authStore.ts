import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser, AuthTokens } from '@/types'

interface AuthStore {
  user: AdminUser | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: AdminUser, tokens: AuthTokens) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (user, tokens) =>
        set({ user, tokens, isAuthenticated: true, isLoading: false }),
      clearAuth: () =>
        set({ user: null, tokens: null, isAuthenticated: false, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'unibot-auth',
      partialize: (state) => ({ user: state.user, tokens: state.tokens, isAuthenticated: state.isAuthenticated }),
    }
  )
)
