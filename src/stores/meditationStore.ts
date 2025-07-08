import { create } from 'zustand'
import { apiService, type Session, type SessionData, type User } from '../services/api'
import { useAuthStore } from './authStore'

interface MeditationState {
  currentSession: SessionData | null
  sessionHistory: Session[]
  sessionStats: {
    totalSessions: number;
    totalMinutes: number;
    currentStreak: number;
    weeklyMinutes: number;
    averageSessionLength: number;
    frequencyStats: Record<string, number>;
  } | null
  isSessionActive: boolean
  isPaused: boolean
  loading: boolean
  error: string | null
  
  // Session management
  startSession: (duration: number, frequency: 'alpha' | 'theta' | 'beta' | 'delta') => void
  pauseSession: () => Promise<void>
  resumeSession: () => Promise<void>
  completeSession: () => Promise<{
    session: Session
    user: User
    xpGained: number
    levelUp: boolean
  }>
  endSession: () => void
  
  // Data fetching
  getSessionHistory: () => Promise<void>
  
  // State management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useMeditationStore = create<MeditationState>((set, get) => ({
  currentSession: null,
  sessionHistory: [],
  sessionStats: null,
  isSessionActive: false,
  isPaused: false,
  loading: false,
  error: null,

  startSession: (duration: number, frequency: 'alpha' | 'theta' | 'beta' | 'delta') => {
    const sessionData: SessionData = {
      duration,
      frequency,
      type: 'meditation',
      actualDuration: duration,
      paused: false,
      pauseCount: 0
    }

    set({
      currentSession: sessionData,
      isSessionActive: true,
      isPaused: false,
      error: null
    })
  },

  pauseSession: async () => {
    const state = get()
    if (state.currentSession && state.isSessionActive) {
      try {
        // If we have a session ID, call the API to pause it
        // For now, just update local state since we don't track session ID during active session
        const updatedSession: SessionData = {
          ...state.currentSession,
          paused: true,
          pauseCount: (state.currentSession.pauseCount || 0) + 1
        }

        set({
          currentSession: updatedSession,
          isPaused: true
        })
      } catch (error: unknown) {
        if (error instanceof Error) {
          set({ error: error.message })
          throw error
        } else {
          set({ error: 'Unknown error' })
          throw new Error('Unknown error')
        }
      }
    }
  },

  resumeSession: async () => {
    const state = get()
    if (state.currentSession && state.isSessionActive && state.isPaused) {
      try {
        // If we have a session ID, call the API to resume it
        // For now, just update local state
        set({
          isPaused: false
        })
      } catch (error: unknown) {
        if (error instanceof Error) {
          set({ error: error.message })
          throw error
        } else {
          set({ error: 'Unknown error' })
          throw new Error('Unknown error')
        }
      }
    }
  },

  completeSession: async () => {
    const state = get()
    if (!state.currentSession || !state.isSessionActive) {
      throw new Error('No active session to complete')
    }

    set({ loading: true, error: null })

    try {
      const response = await apiService.completeSession(state.currentSession)
      // Update auth store with new user data
      const authStore = useAuthStore.getState()
      authStore.setUser(response.user)
      // Add completed session to history
      set({
        sessionHistory: [response.session, ...state.sessionHistory],
        currentSession: null,
        isSessionActive: false,
        isPaused: false,
        loading: false
      })
      return response
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false })
        throw error
      } else {
        set({ error: 'Unknown error', loading: false })
        throw new Error('Unknown error')
      }
    }
  },

  endSession: () => {
    set({
      currentSession: null,
      isSessionActive: false,
      isPaused: false,
      error: null
    })
  },

  getSessionHistory: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiService.getSessionHistory()
      // Validate and map stats to expected type
      const stats = response.stats as {
        totalSessions: number;
        totalMinutes: number;
        currentStreak: number;
        weeklyMinutes: number;
        averageSessionLength: number;
        frequencyStats: Record<string, number>;
      }
      set({
        sessionHistory: response.sessions,
        sessionStats: stats,
        loading: false
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false })
        throw error
      } else {
        set({ error: 'Unknown error', loading: false })
        throw new Error('Unknown error')
      }
    }
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null })
}))

export type { SessionData, Session }
