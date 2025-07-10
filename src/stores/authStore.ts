import { create } from 'zustand'
import { apiService, type User } from '../services/api'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  showOnboarding: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string, gender?: 'male' | 'female' | 'other') => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  completeOnboarding: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  showOnboarding: false,
  
  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiService.login(email, password)
      set({ user: response.user, loading: false })
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false })
      } else {
        set({ error: 'Unknown error', loading: false })
      }
      throw error
    }
  },
  
  signUp: async (email: string, password: string, displayName: string, gender: 'male' | 'female' | 'other' = 'other') => {
    set({ loading: true, error: null })
    try {
      const response = await apiService.register(email, password, displayName, gender)
      set({ user: response.user, loading: false })
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false })
      } else {
        set({ error: 'Unknown error', loading: false })
      }
      throw error
    }
  },
  
  // Aliases for compatibility
  login: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiService.login(email, password)
      set({ user: response.user, loading: false })
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false })
      } else {
        set({ error: 'Unknown error', loading: false })
      }
      throw error
    }
  },
  
  register: async (email: string, password: string, displayName: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiService.register(email, password, displayName)
      set({ user: response.user, loading: false, showOnboarding: true })
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false })
      } else {
        set({ error: 'Unknown error', loading: false })
      }
      throw error
    }
  },
  
  signOut: async () => {
    set({ loading: true, error: null })
    try {
      await apiService.logout()
      set({ user: null, loading: false })
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false })
      } else {
        set({ error: 'Unknown error', loading: false })
      }
      throw error
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    set({ loading: true, error: null })
    try {
      const response = await apiService.updateProfile(updates)
      set({ user: response.user, loading: false })
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false })
      } else {
        set({ error: 'Unknown error', loading: false })
      }
      throw error
    }
  },

  refreshUser: async () => {
    const token = localStorage.getItem('chrysalis_auth_token');
    if (!token) {
      set({ user: null })
      return
    }

    set({ loading: true, error: null })
    try {
      const response = await apiService.getProfile()
      set({ user: response.user, loading: false })
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false })
      } else {
        set({ error: 'Unknown error', loading: false })
      }
      // If token is invalid, clear auth
      if (error instanceof Error && error.message.includes('Authentication')) {
        await apiService.logout()
        set({ user: null, error: null, loading: false })
      }
    }
  },
  
  setUser: (user: User | null) => set({ user }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
  completeOnboarding: () => set({ showOnboarding: false })
}))

// Initialize auth state on app load
if (typeof window !== 'undefined') {
  const { refreshUser } = useAuthStore.getState()
  refreshUser()
}
