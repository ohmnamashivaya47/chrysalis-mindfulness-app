import { create } from 'zustand'

interface PresenceSession {
  id: string
  start_time: string
  end_time?: string
  duration_seconds?: number
  session_type: 'micro' | 'breathing' | 'collective' | 'custom'
  quality_rating?: number
}

interface PresenceState {
  isActive: boolean
  currentSession: PresenceSession | null
  dailyPresenceTime: number
  currentStreak: number
  lastActivityTime: number
  
  // Actions
  startSession: (type: PresenceSession['session_type']) => void
  endSession: (rating?: number) => void
  updateLastActivity: () => void
  setDailyPresenceTime: (time: number) => void
  setCurrentStreak: (streak: number) => void
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  isActive: false,
  currentSession: null,
  dailyPresenceTime: 0,
  currentStreak: 0,
  lastActivityTime: Date.now(),
  
  startSession: (type: PresenceSession['session_type']) => {
    const session: PresenceSession = {
      id: crypto.randomUUID(),
      start_time: new Date().toISOString(),
      session_type: type
    }
    set({ isActive: true, currentSession: session })
  },
  
  endSession: (rating?: number) => {
    const currentSession = get().currentSession
    if (!currentSession) return
    
    const endTime = new Date().toISOString()
    const startTime = new Date(currentSession.start_time)
    const duration = Math.floor((Date.now() - startTime.getTime()) / 1000)
    
    const completedSession: PresenceSession = {
      ...currentSession,
      end_time: endTime,
      duration_seconds: duration,
      quality_rating: rating
    }
    
    // Add to daily presence time
    const currentDailyTime = get().dailyPresenceTime
    set({ 
      isActive: false, 
      currentSession: null, 
      dailyPresenceTime: currentDailyTime + duration 
    })
    
    // Save to database when available
    console.log('Session completed:', completedSession)
  },
  
  updateLastActivity: () => {
    set({ lastActivityTime: Date.now() })
  },
  
  setDailyPresenceTime: (time: number) => set({ dailyPresenceTime: time }),
  setCurrentStreak: (streak: number) => set({ currentStreak: streak }),
}))
