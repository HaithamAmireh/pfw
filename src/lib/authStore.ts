import { create } from 'zustand'
import { api, apiErrorMessage, type SessionUser } from './api'

interface AuthState {
  status: 'checking' | 'signed-out' | 'signed-in'
  user: SessionUser | null
  error: string | null

  checkSession: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, signupCode?: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuth = create<AuthState>((set) => ({
  status: 'checking',
  user: null,
  error: null,

  checkSession: async () => {
    try {
      const user = await api.me()
      set({ status: 'signed-in', user, error: null })
    } catch {
      set({ status: 'signed-out', user: null })
    }
  },

  login: async (email, password) => {
    try {
      const user = await api.login(email, password)
      set({ status: 'signed-in', user, error: null })
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  register: async (email, password, signupCode) => {
    try {
      const user = await api.register(email, password, signupCode)
      set({ status: 'signed-in', user, error: null })
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  logout: async () => {
    await api.logout().catch(() => {})
    set({ status: 'signed-out', user: null, error: null })
  },

  clearError: () => set({ error: null }),
}))
