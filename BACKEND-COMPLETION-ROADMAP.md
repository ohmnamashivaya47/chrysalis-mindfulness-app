# CHRYSALIS Backend Completion Roadmap

## Current Status: ~40% Complete

### ✅ COMPLETED Backend Features
- User authentication (register, login)
- Session completion tracking
- Global leaderboard
- User profile management
- Database utilities (Netlify Blobs)
- Authentication utilities (JWT, bcrypt)

### 🔄 CRITICAL Backend Tasks Remaining

#### 1. Session Management (HIGH PRIORITY)
- `GET /api/sessions/history` - User's meditation history
- `GET /api/sessions/stats` - User meditation statistics
- `POST /api/sessions/pause` - Pause session tracking
- `POST /api/sessions/resume` - Resume session tracking

#### 2. Social Features (HIGH PRIORITY)
- `POST /api/friends/add` - Send friend request
- `POST /api/friends/accept` - Accept friend request
- `POST /api/friends/decline` - Decline friend request
- `GET /api/friends/list` - Get user's friends
- `DELETE /api/friends/remove` - Remove friend
- `GET /api/friends/requests` - Get pending requests

#### 3. Group System (HIGH PRIORITY)
- `POST /api/groups/create` - Create meditation group
- `POST /api/groups/join` - Join group by code
- `GET /api/groups/list` - User's groups
- `GET /api/groups/:id` - Group details & members
- `DELETE /api/groups/:id/leave` - Leave group
- `GET /api/groups/:id/leaderboard` - Group leaderboard

#### 4. Enhanced Leaderboards (MEDIUM PRIORITY)
- `GET /api/leaderboards/local` - Local area leaderboard
- `GET /api/leaderboards/friends` - Friends leaderboard
- `GET /api/leaderboards/group/:id` - Group-specific leaderboard

#### 5. Content Management (MEDIUM PRIORITY)
- `GET /api/content/quotes` - Daily wisdom quotes
- `GET /api/content/programs` - Meditation programs
- `GET /api/content/audio` - Audio session metadata

#### 6. Analytics & Insights (LOW PRIORITY)
- `GET /api/analytics/streaks` - Meditation streaks
- `GET /api/analytics/patterns` - User patterns
- `GET /api/analytics/achievements` - Achievement progress

### Database Schema Extensions Needed

#### Sessions Table Enhancement
```javascript
{
  id: string,
  userId: string,
  duration: number,
  frequency: string,
  startTime: Date,
  endTime: Date,
  completed: boolean,
  paused: boolean,
  pausedAt: Date,
  resumedAt: Date,
  xpGained: number,
  program: string || null
}
```

#### Friends Table
```javascript
{
  id: string,
  requesterUserId: string,
  requestedUserId: string,
  status: 'pending' | 'accepted' | 'declined',
  createdAt: Date,
  updatedAt: Date
}
```

#### Groups Table
```javascript
{
  id: string,
  name: string,
  code: string,
  createdBy: string,
  createdAt: Date,
  memberCount: number,
  isPublic: boolean,
  description: string
}
```

#### Group Members Table
```javascript
{
  id: string,
  groupId: string,
  userId: string,
  joinedAt: Date,
  role: 'member' | 'admin'
}
```

### Implementation Priority Order
1. **Session History & Stats** (Users need to see their progress)
2. **Friends System** (Core social feature)
3. **Group Creation & Management** (Community building)
4. **Enhanced Leaderboards** (Social competition)
5. **Content Management** (Guided experiences)
6. **Analytics & Insights** (User engagement)

### Estimated Timeline
- Session Management: 1 day
- Social Features: 2 days
- Group System: 2 days
- Enhanced Leaderboards: 1 day
- Content Management: 1 day
- Analytics: 1 day

**Total Backend Completion: ~8 days**
