# CHRYSALIS Frontend Connection Roadmap

## Current Status: ~30% Connected to Backend

### ✅ CONNECTED Components
- LoginScreen (register/login)
- MeditationSession (session completion)
- Profile (user data, profile updates)
- Global Leaderboard (real data)

### 🔄 FRONTEND Connection Tasks Remaining

#### 1. Session History Integration (HIGH PRIORITY)
**Component:** Profile.tsx
- Replace mock `sessionHistory` with API call to `/api/sessions/history`
- Add loading states for session data
- Implement error handling for failed requests
- Update session stats display with real data

#### 2. Friends System UI (HIGH PRIORITY)
**Component:** Groups.tsx (needs refactor to Friends.tsx)
- Create dedicated Friends component
- Implement friend search and add functionality
- Add friend request management (accept/decline)
- Show friends list with status indicators
- Connect to friends API endpoints

#### 3. Group System Integration (HIGH PRIORITY)
**Component:** Groups.tsx
- Replace mock group data with real API calls
- Implement group creation with validation
- Add group joining by code functionality
- Show real group members and activity
- Connect to group API endpoints

#### 4. Enhanced Leaderboards (MEDIUM PRIORITY)
**Component:** Leaderboard.tsx
- Add tabs for Local/Friends/Groups leaderboards
- Implement real-time updates for leaderboard data
- Add filtering and search functionality
- Connect to enhanced leaderboard endpoints

#### 5. Session Management Enhancement (MEDIUM PRIORITY)
**Component:** MeditationSession.tsx
- Add pause/resume functionality with backend sync
- Implement session history tracking
- Add meditation program selection
- Real-time XP calculation and display

#### 6. Content Integration (LOW PRIORITY)
**New Components:** 
- Daily wisdom quotes display
- Meditation program browser
- Audio content management
- Achievement system UI

### State Management Updates Needed

#### Meditation Store Enhancement
```typescript
interface MeditationState {
  // Existing fields...
  sessionHistory: MeditationSession[];
  currentProgram: Program | null;
  isPaused: boolean;
  pausedAt: Date | null;
  
  // New methods
  fetchSessionHistory: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  selectProgram: (program: Program) => void;
}
```

#### New Social Store
```typescript
interface SocialState {
  friends: Friend[];
  friendRequests: FriendRequest[];
  groups: Group[];
  
  // Friend methods
  addFriend: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  
  // Group methods
  createGroup: (groupData: CreateGroupData) => Promise<void>;
  joinGroup: (groupCode: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  fetchGroups: () => Promise<void>;
}
```

### Component Refactoring Needed

#### 1. Groups.tsx → Split into:
- `Groups.tsx` - Group management
- `Friends.tsx` - Friend system
- `Social.tsx` - Combined social hub

#### 2. Navigation.tsx Updates
- Add Friends tab/section
- Update routing for new components
- Add notification badges for friend requests

#### 3. New Components to Create
- `SessionHistory.tsx` - Detailed session history
- `FriendsList.tsx` - Friends management
- `GroupDetails.tsx` - Individual group view
- `Achievements.tsx` - Achievement system
- `DailyQuote.tsx` - Wisdom quotes display

### API Service Extensions
```typescript
// Add to api.ts
export const friendsAPI = {
  addFriend: (userId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  getFriends: () => Promise<Friend[]>;
  getRequests: () => Promise<FriendRequest[]>;
};

export const groupsAPI = {
  createGroup: (data: CreateGroupData) => Promise<Group>;
  joinGroup: (code: string) => Promise<void>;
  getGroups: () => Promise<Group[]>;
  getGroupDetails: (id: string) => Promise<GroupDetails>;
};

export const sessionsAPI = {
  getHistory: () => Promise<MeditationSession[]>;
  getStats: () => Promise<SessionStats>;
  pauseSession: (sessionId: string) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
};
```

### Implementation Priority Order
1. **Session History** (Users need to see progress)
2. **Friends System UI** (Core social feature)
3. **Group System Integration** (Community building)
4. **Enhanced Leaderboards** (Competition)
5. **Content Management** (Rich experience)
6. **Achievement System** (Gamification)

### Estimated Timeline
- Session History Integration: 0.5 days
- Friends System UI: 1.5 days
- Group System Integration: 1.5 days
- Enhanced Leaderboards: 1 day
- Content Integration: 1 day
- Achievement System: 0.5 days

**Total Frontend Connection: ~6 days**
