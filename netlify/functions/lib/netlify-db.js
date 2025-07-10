// CHRYSALIS - Enhanced Netlify Database Client using Netlify Blobs
// Comprehensive database layer for meditation app with full CRUD operations

import { getStore } from '@netlify/blobs';

// Initialize Netlify Blobs stores for different data types
const usersStore = getStore('users');
const sessionsStore = getStore('sessions');
const groupsStore = getStore('groups');
const groupMembersStore = getStore('group_members');
const friendshipsStore = getStore('friendships');
const achievementsStore = getStore('achievements');
const emailIndexStore = getStore('email_index'); // For email->userId mapping

// Helper function to generate UUIDs
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to calculate user level from experience
function calculateLevel(experience) {
  return Math.floor(experience / 100) + 1;
}

// Helper function to calculate XP from session duration
function calculateSessionXP(durationMinutes) {
  return durationMinutes * 2; // 2 XP per minute
}

// USER MANAGEMENT FUNCTIONS
const userHelpers = {
  // Create a new user account
  async createUser(userData) {
    if (!isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Check if email already exists
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const userId = generateId();
    const user = {
      id: userId,
      email: userData.email.toLowerCase(),
      passwordHash: userData.passwordHash,
      displayName: userData.displayName || userData.email.split('@')[0],
      profilePicture: null,
      joinedAt: getCurrentTimestamp(),
      totalSessions: 0,
      totalMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      level: 1,
      experience: 0,
      lastSessionDate: null,
      preferences: {
        defaultDuration: 10,
        defaultFrequency: 'alpha',
        notifications: true,
        theme: 'light'
      }
    };
    
    // Store user data
    await usersStore.set(userId, JSON.stringify(user));
    
    // Create email->userId mapping for quick lookups
    await emailIndexStore.set(userData.email.toLowerCase(), userId);
    
    return user;
  },

  // Get user by email address
  async getUserByEmail(email) {
    try {
      const userId = await emailIndexStore.get(email.toLowerCase());
      if (!userId) return null;
      
      const userData = await usersStore.get(userId);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const userData = await usersStore.get(userId);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  },

  // Update user profile
  async updateUser(userId, updateData) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Merge update data with existing user data
    const updatedUser = {
      ...user,
      ...updateData,
      // Ensure calculated fields are updated if XP changed
      level: updateData.experience ? calculateLevel(updateData.experience) : user.level
    };

    await usersStore.set(userId, JSON.stringify(updatedUser));
    return updatedUser;
  },

  // Update user stats after session completion
  async updateUserStats(userId, sessionData) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const xpGained = calculateSessionXP(sessionData.duration);
    const newExperience = user.experience + xpGained;
    
    // Calculate streak
    const today = new Date().toISOString().split('T')[0];
    const lastSessionDate = user.lastSessionDate ? user.lastSessionDate.split('T')[0] : null;
    
    let newCurrentStreak = user.currentStreak;
    if (lastSessionDate === today) {
      // Same day, streak unchanged
      newCurrentStreak = user.currentStreak;
    } else if (lastSessionDate === getPreviousDay(today)) {
      // Previous day, increment streak
      newCurrentStreak = user.currentStreak + 1;
    } else {
      // Streak broken, reset to 1
      newCurrentStreak = 1;
    }

    const updatedUser = {
      ...user,
      totalSessions: user.totalSessions + 1,
      totalMinutes: user.totalMinutes + sessionData.duration,
      experience: newExperience,
      level: calculateLevel(newExperience),
      currentStreak: newCurrentStreak,
      longestStreak: Math.max(user.longestStreak, newCurrentStreak),
      lastSessionDate: getCurrentTimestamp()
    };

    await usersStore.set(userId, JSON.stringify(updatedUser));
    return { user: updatedUser, xpGained };
  },

  // Get top users for leaderboard
  async getTopUsers(limit = 50) {
    try {
      const userList = await usersStore.list();
      const users = [];
      
      for (const { key } of userList.blobs) {
        const userData = await usersStore.get(key);
        if (userData) {
          const user = JSON.parse(userData);
          // Remove sensitive data
          delete user.passwordHash;
          delete user.email;
          users.push(user);
        }
      }
      
      // Sort by total minutes (primary) and level (secondary)
      users.sort((a, b) => {
        if (b.totalMinutes !== a.totalMinutes) {
          return b.totalMinutes - a.totalMinutes;
        }
        return b.level - a.level;
      });
      
      return users.slice(0, limit);
    } catch (error) {
      console.error('Error getting top users:', error);
      return [];
    }
  },

  // Find user by email
  async getUserByEmail(email) {
    try {
      const userList = await usersStore.list();
      for (const { key } of userList.blobs) {
        const userData = await usersStore.get(key);
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email === email) {
            return user;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  },

  async getUserById(id) {
    const userData = await usersStore.get(id);
    return userData ? JSON.parse(userData) : null;
  },

  async updateUser(id, updates) {
    const user = await this.getUserById(id);
    if (!user) return null;
    
    const updatedUser = { ...user, ...updates };
    await usersStore.set(id, JSON.stringify(updatedUser));
    return updatedUser;
  },

  async updateLastLogin(id) {
    return this.updateUser(id, { lastLoginAt: getCurrentTimestamp() });
  }
};

// SESSION MANAGEMENT FUNCTIONS
const sessionHelpers = {
  // Record a completed meditation session
  async createSession(userId, sessionData) {
    const sessionId = generateId();
    const session = {
      id: sessionId,
      userId,
      duration: sessionData.duration,
      frequency: sessionData.frequency,
      completedAt: getCurrentTimestamp(),
      xpGained: calculateSessionXP(sessionData.duration),
      type: sessionData.type || 'meditation',
      actualDuration: sessionData.actualDuration || sessionData.duration,
      paused: sessionData.paused || false,
      pauseCount: sessionData.pauseCount || 0
    };

    await sessionsStore.set(sessionId, JSON.stringify(session));
    return session;
  },

  // Get user's session history
  async getUserSessions(userId, limit = 50) {
    try {
      const sessionList = await sessionsStore.list();
      const userSessions = [];
      
      for (const { key } of sessionList.blobs) {
        const sessionData = await sessionsStore.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.userId === userId) {
            userSessions.push(session);
          }
        }
      }
      
      // Sort by completion date (newest first)
      userSessions.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      
      return userSessions.slice(0, limit);
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  },

  // Get session statistics for analytics
  async getSessionStats(userId) {
    const sessions = await this.getUserSessions(userId);
    
    const stats = {
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce((sum, s) => sum + s.duration, 0),
      averageSessionLength: sessions.length > 0 ? 
        Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length) : 0,
      favoriteFrequency: getMostUsedFrequency(sessions),
      sessionsThisWeek: getSessionsThisWeek(sessions),
      sessionsThisMonth: getSessionsThisMonth(sessions)
    };
    
    return stats;
  }
};

// GROUP MANAGEMENT FUNCTIONS
const socialHelpers = {
  // Create a new meditation group
  async createGroup(groupData) {
    const groupId = generateId();
    const group = {
      id: groupId,
      name: groupData.name,
      description: groupData.description,
      createdBy: groupData.createdBy,
      createdAt: getCurrentTimestamp(),
      memberCount: 1, // Creator is first member
      isPublic: groupData.isPublic || true
    };

    await groupsStore.set(groupId, JSON.stringify(group));
    
    // Add creator as first member
    await this.addGroupMember(groupId, groupData.createdBy, 'admin');
    
    return group;
  },

  // Add a member to a group
  async addGroupMember(groupId, userId, role = 'member') {
    const membershipId = generateId();
    const membership = {
      id: membershipId,
      groupId,
      userId,
      joinedAt: getCurrentTimestamp(),
      role
    };

    await groupMembersStore.set(membershipId, JSON.stringify(membership));
    
    // Update group member count
    const group = await this.getGroupById(groupId);
    if (group) {
      group.memberCount += 1;
      await groupsStore.set(groupId, JSON.stringify(group));
    }
    
    return membership;
  },

  // Get group by ID
  async getGroupById(groupId) {
    try {
      const groupData = await groupsStore.get(groupId);
      return groupData ? JSON.parse(groupData) : null;
    } catch (error) {
      console.error('Error getting group:', error);
      return null;
    }
  },

  // Get all public groups
  async getPublicGroups(limit = 50) {
    try {
      const groupList = await groupsStore.list();
      const groups = [];
      
      for (const { key } of groupList.blobs) {
        const groupData = await groupsStore.get(key);
        if (groupData) {
          const group = JSON.parse(groupData);
          if (group.isPublic) {
            groups.push(group);
          }
        }
      }
      
      // Sort by member count (most popular first)
      groups.sort((a, b) => b.memberCount - a.memberCount);
      
      return groups.slice(0, limit);
    } catch (error) {
      console.error('Error getting public groups:', error);
      return [];
    }
  },

  // Get user's groups
  async getUserGroups(userId) {
    try {
      const membershipList = await groupMembersStore.list();
      const userGroups = [];
      
      for (const { key } of membershipList.blobs) {
        const membershipData = await groupMembersStore.get(key);
        if (membershipData) {
          const membership = JSON.parse(membershipData);
          if (membership.userId === userId) {
            const group = await this.getGroupById(membership.groupId);
            if (group) {
              userGroups.push({
                ...group,
                userRole: membership.role,
                joinedAt: membership.joinedAt
              });
            }
          }
        }
      }
      
      return userGroups;
    } catch (error) {
      console.error('Error getting user groups:', error);
      return [];
    }
  },

  // Get group leaderboard
  async getGroupLeaderboard(groupId) {
    try {
      // Get all group members
      const membershipList = await groupMembersStore.list();
      const memberUserIds = [];
      
      for (const { key } of membershipList.blobs) {
        const membershipData = await groupMembersStore.get(key);
        if (membershipData) {
          const membership = JSON.parse(membershipData);
          if (membership.groupId === groupId) {
            memberUserIds.push(membership.userId);
          }
        }
      }
      
      // Get user data for all members
      const memberStats = [];
      for (const userId of memberUserIds) {
        const user = await userHelpers.getUserById(userId);
        if (user) {
          memberStats.push({
            id: user.id,
            name: user.displayName,
            minutes: user.totalMinutes,
            streak: user.currentStreak,
            level: user.level,
            sessions: user.totalSessions
          });
        }
      }
      
      // Sort by total minutes
      memberStats.sort((a, b) => b.minutes - a.minutes);
      
      return memberStats;
    } catch (error) {
      console.error('Error getting group leaderboard:', error);
      return [];
    }
  }
};

// UTILITY FUNCTIONS
function getPreviousDay(dateString) {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

function getMostUsedFrequency(sessions) {
  const frequencyCount = {};
  sessions.forEach(session => {
    frequencyCount[session.frequency] = (frequencyCount[session.frequency] || 0) + 1;
  });
  
  let mostUsed = 'alpha';
  let maxCount = 0;
  for (const [frequency, count] of Object.entries(frequencyCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostUsed = frequency;
    }
  }
  
  return mostUsed;
}

function getSessionsThisWeek(sessions) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return sessions.filter(session => 
    new Date(session.completedAt) >= oneWeekAgo
  ).length;
}

function getSessionsThisMonth(sessions) {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  return sessions.filter(session => 
    new Date(session.completedAt) >= oneMonthAgo
  ).length;
}

// VALIDATION HELPERS
const validators = {
  email: (email) => {
    return isValidEmail(email);
  },
  
  password: (password) => {
    return password && password.length >= 6;
  },
  
  displayName: (name) => {
    return name && name.trim().length >= 2 && name.trim().length <= 50;
  },
  
  sessionDuration: (duration) => {
    return Number.isInteger(duration) && duration >= 1 && duration <= 120;
  },
  
  frequency: (freq) => {
    return ['alpha', 'theta', 'beta', 'delta'].includes(freq);
  }
};

// CONSTANTS
const CONSTANTS = {
  XP_PER_MINUTE: 2,
  XP_PER_LEVEL: 100,
  MAX_SESSION_DURATION: 120, // minutes
  MIN_SESSION_DURATION: 1,   // minutes
  FREQUENCIES: ['alpha', 'theta', 'beta', 'delta'],
  DEFAULT_LEADERBOARD_LIMIT: 50
};

// Export all helpers
export {
  usersStore,
  sessionsStore,
  groupsStore,
  groupMembersStore,
  friendshipsStore,
  achievementsStore,
  emailIndexStore,
  userHelpers,
  sessionHelpers,
  socialHelpers,
  validators,
  CONSTANTS,
  generateId,
  getCurrentTimestamp
};
