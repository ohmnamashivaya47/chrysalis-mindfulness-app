// API client for Netlify Functions with FaunaDB and Authentication
class ChrysalisAPI {
  private baseURL: string
  private token: string | null = null

  constructor() {
    // Use the new Express backend on Render
    // For development, use local backend; for production use deployed Render URL
    this.baseURL = import.meta.env.DEV 
      ? 'http://localhost:3001/api'
      : 'https://chrysalis-backend.onrender.com/api'
    
    // Load token from localStorage
    this.token = localStorage.getItem('chrysalis_token')
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    }

    // Add authorization header if token exists
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    
    const response = await fetch(url, {
      headers,
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Authentication API
  async signUp(email: string, password: string, displayName?: string) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        username: displayName || email.split('@')[0],
        full_name: displayName || email.split('@')[0]
      }),
    })

    if (response.success) {
      this.token = response.token
      localStorage.setItem('chrysalis_token', this.token!)
    }

    return response
  }

  async signIn(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password
      }),
    })

    if (response.success) {
      this.token = response.token
      localStorage.setItem('chrysalis_token', this.token!)
    }

    return response
  }

  signOut() {
    this.token = null
    localStorage.removeItem('chrysalis_token')
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  // Presence Sessions API
  async createPresenceSession(sessionData: {
    startTime: string
    endTime?: string
    sessionType: 'micro' | 'breathing' | 'collective' | 'custom'
    duration?: number
    qualityRating?: number
    triggerType?: 'manual' | 'automatic' | 'scheduled'
  }) {
    return this.request('/presence/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    })
  }

  async getUserSessions() {
    return this.request('/presence/sessions')
  }

  // Wisdom Quotes API
  async getDailyQuote() {
    return this.request('/wisdom/quotes/daily')
  }

  // User Stats (calculated from sessions)
  async getUserStats() {
    const sessionsResponse = await this.getUserSessions()
    if (!sessionsResponse.success) {
      throw new Error('Failed to get user stats')
    }

    const sessions = sessionsResponse.data as Session[]
    const totalTime = sessions.reduce((sum: number, session: Session) => 
      sum + (session.duration_seconds || 0), 0)
    
    // Calculate streak (simplified - count days with sessions)
    const sessionDates = new Set(sessions.map((session: Session) => 
      new Date(session.start_time).toDateString()))
    
    return {
      success: true,
      data: {
        totalPresenceTime: totalTime,
        currentStreak: sessionDates.size, // Simplified streak calculation
        totalSessions: sessions.length,
        weeklyTime: totalTime, // Simplified - would filter by week in real app
        achievements: this.calculateAchievements(sessions)
      }
    }
  }

  private calculateAchievements(sessions: Session[]): string[] {
    const achievements = []
    
    if (sessions.length >= 1) achievements.push('first_session')
    if (sessions.length >= 10) achievements.push('mindful_moments_10')
    if (sessions.length >= 50) achievements.push('mindful_moments_50')
    
    const totalTime = sessions.reduce((sum, session) => 
      sum + (session.duration_seconds || 0), 0)
    
    if (totalTime >= 300) achievements.push('five_minutes') // 5 minutes
    if (totalTime >= 3600) achievements.push('one_hour')   // 1 hour
    
    return achievements
  }

  // Community features (mock for now)
  async getNearbyPresence() {
    return {
      success: true,
      data: {
        activeUsers: 12,
        nearbySignals: [
          { id: 1, distance: '0.5 miles', active: true },
          { id: 2, distance: '1.2 miles', active: true },
          { id: 3, distance: '2.1 miles', active: false }
        ]
      }
    }
  }
}

export const api = new ChrysalisAPI()

// Types for API responses
export interface PresenceSession {
  id: string
  user_id: string
  start_time: string
  end_time?: string
  duration_seconds?: number
  session_type: 'micro' | 'breathing' | 'collective' | 'custom'
  quality_rating?: number
  trigger_type?: 'manual' | 'automatic' | 'scheduled'
  created_at: string
}

export interface WisdomQuote {
  id: string
  text: string
  author: string
  category: string
}

export interface User {
  id: string
  email: string
  display_name: string
  total_presence_time: number
  current_streak: number
}

export interface UserStats {
  totalPresenceTime: number
  currentStreak: number
  totalSessions: number
  weeklyTime: number
  achievements: string[]
}

export interface APIResponse<T> {
  success: boolean
  data: T
  error?: string
}

export interface Session {
  id: string
  start_time: string
  end_time?: string
  duration_seconds?: number
  sessionType?: string
  qualityRating?: number
  triggerType?: string
}
