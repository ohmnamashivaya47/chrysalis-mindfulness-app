// This file is not used anywhere in the app. Supabase has been removed from the project.
// Keeping this file for reference only. You can safely delete it if not needed.

// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url'
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: true
//   }
// })

// Database types
// export interface User {
//   id: string
//   email?: string
//   display_name?: string
//   avatar_url?: string
//   created_at: string
//   total_presence_time: number
//   current_streak: number
//   privacy_level: 'public' | 'friends' | 'private'
// }

// export interface PresenceSession {
//   id: string
//   user_id: string
//   start_time: string
//   end_time: string
//   duration_seconds: number
//   session_type: 'micro' | 'breathing' | 'collective' | 'custom'
//   quality_rating?: number
//   created_at: string
// }

// export interface Friendship {
//   id: string
//   user_id: string
//   friend_id: string
//   status: 'pending' | 'accepted' | 'blocked'
//   created_at: string
// }

// export interface MindfulnessGroup {
//   id: string
//   name: string
//   creator_id: string
//   description?: string
//   max_members: number
//   privacy_level: 'public' | 'invite_only' | 'private'
//   created_at: string
// }

// export interface PresenceSignal {
//   id: string
//   user_id: string
//   latitude?: number
//   longitude?: number
//   is_active: boolean
//   expires_at: string
//   created_at: string
// }
