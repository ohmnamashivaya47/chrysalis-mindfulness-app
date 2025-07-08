// Presence Sessions Function using Netlify Blobs
const jwt = require('jsonwebtoken');
const { getStore } = require('@netlify/blobs');

// Initialize stores
const sessionsStore = getStore('sessions');
const usersStore = getStore('users');

// Helper functions
const helpers = {
  generateId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  },

  async getUserFromToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      return null;
    }
  },

  async createSession(sessionData, userId) {
    const session = {
      id: this.generateId(),
      userId: userId,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime || new Date().toISOString(),
      sessionType: sessionData.sessionType,
      duration: sessionData.duration,
      qualityRating: sessionData.qualityRating,
      triggerType: sessionData.triggerType || 'manual',
      notes: sessionData.notes || '',
      createdAt: new Date().toISOString()
    };
    
    await sessionsStore.set(session.id, JSON.stringify(session));
    
    // Update user stats
    await this.updateUserStats(userId, session);
    
    return session;
  },

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
      
      // Sort by startTime descending and limit
      return userSessions
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  },

  async updateUserStats(userId, session) {
    try {
      const userData = await usersStore.get(userId);
      if (userData) {
        const user = JSON.parse(userData);
        const profile = user.profile;
        
        profile.totalSessions += 1;
        profile.totalPresenceTime += session.duration || 0;
        
        // Calculate streak (simplified)
        const today = new Date().toDateString();
        const sessionDate = new Date(session.startTime).toDateString();
        if (sessionDate === today) {
          profile.currentStreak = Math.max(profile.currentStreak, 1);
          profile.longestStreak = Math.max(profile.longestStreak, profile.currentStreak);
        }

        await usersStore.set(userId, JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  },

  async getUserStats(userId) {
    try {
      const userData = await usersStore.get(userId);
      if (!userData) return null;

      const user = JSON.parse(userData);
      const sessions = await this.getUserSessions(userId);
      
      // Calculate additional stats
      const thisWeek = sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= weekAgo;
      });

      const thisMonth = sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return sessionDate >= monthAgo;
      });

      return {
        totalSessions: user.profile.totalSessions,
        totalPresenceTime: user.profile.totalPresenceTime,
        currentStreak: user.profile.currentStreak,
        longestStreak: user.profile.longestStreak,
        weeklyStats: {
          sessions: thisWeek.length,
          totalTime: thisWeek.reduce((sum, s) => sum + (s.duration || 0), 0)
        },
        monthlyStats: {
          sessions: thisMonth.length,
          totalTime: thisMonth.reduce((sum, s) => sum + (s.duration || 0), 0)
        },
        averageSessionLength: sessions.length > 0 
          ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length)
          : 0,
        favoriteSessionType: this.getMostFrequentSessionType(sessions),
        recentSessions: sessions.slice(0, 5)
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  },

  getMostFrequentSessionType(sessions) {
    const typeCounts = {};
    sessions.forEach(s => {
      typeCounts[s.sessionType] = (typeCounts[s.sessionType] || 0) + 1;
    });
    
    return Object.entries(typeCounts).reduce((a, b) => 
      typeCounts[a[0]] > typeCounts[b[0]] ? a : b
    )?.[0] || 'micro';
  }
};

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/presence-sessions', '');
    const method = event.httpMethod;

    // Get user from token
    const user = await helpers.getUserFromToken(event.headers.authorization);
    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Authentication required'
        })
      };
    }

    // Create Session
    if (path === '' && method === 'POST') {
      const sessionData = JSON.parse(event.body);

      if (!sessionData.startTime || !sessionData.sessionType) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'startTime and sessionType are required'
          })
        };
      }

      const session = await helpers.createSession(sessionData, user.userId);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: { session }
        })
      };
    }

    // Get User Sessions
    if (path === '' && method === 'GET') {
      const sessions = await helpers.getUserSessions(user.userId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: { sessions }
        })
      };
    }

    // Get User Stats
    if (path === '/stats' && method === 'GET') {
      const stats = await helpers.getUserStats(user.userId);

      if (!stats) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'User stats not found'
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: stats
        })
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Route not found'
      })
    };

  } catch (error) {
    console.error('Presence sessions function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};
