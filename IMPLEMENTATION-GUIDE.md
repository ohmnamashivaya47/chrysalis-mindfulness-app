# CHRYSALIS - Technical Implementation Guide 🔧

## 🏗️ **PHASE 1: FOUNDATION BACKEND - DETAILED IMPLEMENTATION**

### **Step 1: Database Schema Setup**

#### Netlify Blobs Structure
```javascript
// Database Collections
const DB_COLLECTIONS = {
  USERS: 'users',
  SESSIONS: 'sessions', 
  GROUPS: 'groups',
  GROUP_MEMBERS: 'group_members',
  FRIENDSHIPS: 'friendships',
  ACHIEVEMENTS: 'achievements'
}

// User Document Schema
const UserSchema = {
  id: 'string',                    // UUID
  email: 'string',                 // Unique email
  passwordHash: 'string',          // Bcrypt hash
  displayName: 'string',           // Display name
  profilePicture: 'string?',       // URL or null
  joinedAt: 'timestamp',           // ISO string
  totalSessions: 'number',         // Count of completed sessions
  totalMinutes: 'number',          // Total meditation time
  currentStreak: 'number',         // Days in current streak
  longestStreak: 'number',         // Longest ever streak
  level: 'number',                 // User level (calculated from XP)
  experience: 'number',            // Total XP points
  lastSessionDate: 'string?',      // ISO date string
  preferences: {
    defaultDuration: 'number',     // Default session length
    defaultFrequency: 'string',    // Default binaural frequency
    notifications: 'boolean',      // Push notification preference
    theme: 'string'                // UI theme preference
  }
}

// Session Document Schema
const SessionSchema = {
  id: 'string',                    // UUID
  userId: 'string',                // Foreign key to user
  duration: 'number',              // Session length in minutes
  frequency: 'string',             // Binaural frequency used
  completedAt: 'timestamp',        // When session completed
  xpGained: 'number',              // XP earned this session
  type: 'string',                  // 'meditation', 'breathing', etc.
  actualDuration: 'number',        // Actual time spent (for pause/resume)
  paused: 'boolean',               // Whether session was paused
  pauseCount: 'number'             // How many times paused
}
```

### **Step 2: Authentication Functions**

#### Register Function
```javascript
// netlify/functions/auth/register.js
exports.handler = async (event, context) => {
  // Input validation
  // Password hashing  
  // Email uniqueness check
  // User creation
  // JWT token generation
  // Response with user data
}
```

#### Login Function  
```javascript
// netlify/functions/auth/login.js
exports.handler = async (event, context) => {
  // Input validation
  // User lookup by email
  // Password verification
  // JWT token generation
  // Last login update
  // Response with user data and token
}
```

### **Step 3: Session Tracking Functions**

#### Complete Session Function
```javascript
// netlify/functions/sessions/complete-session.js
exports.handler = async (event, context) => {
  // JWT authentication
  // Session data validation
  // XP calculation (duration * 2)
  // Level calculation
  // Streak calculation
  // User stats update
  // Session record creation
  // Achievement checks
  // Response with updated stats
}
```

### **Step 4: User Management Functions**

#### Profile Function
```javascript
// netlify/functions/users/profile.js
exports.handler = async (event, context) => {
  if (httpMethod === 'GET') {
    // Get user profile
  } else if (httpMethod === 'PUT') {
    // Update user profile
    // Handle profile picture updates
    // Validate display name
  }
}
```

---

## 🔄 **FRONTEND INTEGRATION PLAN**

### **Step 1: API Service Layer**
```typescript
// src/services/api.ts
class ApiService {
  private baseUrl = '/.netlify/functions'
  private authToken: string | null = null

  async register(email: string, password: string, displayName: string)
  async login(email: string, password: string)
  async logout()
  async getProfile()
  async updateProfile(data: Partial<User>)
  async completeSession(sessionData: SessionData)
  async getLeaderboard(type: 'global' | 'local' | 'friends')
  async createGroup(name: string, description: string)
  async joinGroup(groupId: string)
  // ... more methods
}
```

### **Step 2: Enhanced Auth Store**
```typescript
// src/stores/authStore.ts - Enhanced version
interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
}
```

### **Step 3: Session Management Store**
```typescript
// src/stores/meditationStore.ts - New store
interface MeditationState {
  currentSession: Session | null
  sessionHistory: Session[]
  isSessionActive: boolean
  isPaused: boolean
  startSession: (duration: number, frequency: string) => void
  pauseSession: () => void
  resumeSession: () => void
  completeSession: () => Promise<void>
  getSessionHistory: () => Promise<void>
}
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Backend Functions to Create**
- [ ] `netlify/functions/auth/register.js`
- [ ] `netlify/functions/auth/login.js`  
- [ ] `netlify/functions/auth/logout.js`
- [ ] `netlify/functions/users/profile.js`
- [ ] `netlify/functions/users/stats.js`
- [ ] `netlify/functions/sessions/complete-session.js`
- [ ] `netlify/functions/sessions/history.js`
- [ ] `netlify/functions/leaderboards/global.js`
- [ ] `netlify/functions/leaderboards/local.js`
- [ ] `netlify/functions/leaderboards/friends.js`
- [ ] `netlify/functions/social/groups.js`
- [ ] `netlify/functions/social/friends.js`

### **Database Helpers to Create**
- [ ] `netlify/functions/lib/netlify-db.js` (Enhanced)
- [ ] `netlify/functions/lib/auth-utils.js`
- [ ] `netlify/functions/lib/validators.js`
- [ ] `netlify/functions/lib/calculations.js`

### **Frontend Services to Create**
- [ ] `src/services/api.ts`
- [ ] `src/services/auth.ts`
- [ ] `src/services/sessions.ts`
- [ ] `src/services/social.ts`

### **Frontend Hooks to Create**
- [ ] `src/hooks/useAuth.ts`
- [ ] `src/hooks/useApi.ts`
- [ ] `src/hooks/useMeditation.ts`
- [ ] `src/hooks/useLeaderboard.ts`

### **Frontend Store Updates**
- [ ] Enhance `src/stores/authStore.ts`
- [ ] Create `src/stores/meditationStore.ts`
- [ ] Create `src/stores/socialStore.ts`

### **Component Updates Needed**
- [ ] Connect `LoginScreen.tsx` to real API
- [ ] Connect `MeditationSession.tsx` to session tracking
- [ ] Connect `Leaderboard.tsx` to real data
- [ ] Connect `Groups.tsx` to real group system
- [ ] Connect `Profile.tsx` to real user data

---

## 🚀 **READY TO START?**

I have the complete roadmap and technical implementation plan ready. The next step is to begin Phase 1 implementation.

**Should I start building the backend functions now?**

I'll begin with:
1. Enhanced database helpers
2. User authentication functions  
3. Session tracking functions
4. Frontend API integration

This will get the core functionality working with real data persistence.
