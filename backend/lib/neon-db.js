// CHRYSALIS - Database Configuration and Utilities
// Updated to use Neon PostgreSQL instead of Netlify Blobs

const { Pool } = require('pg');

// Database connection configuration
const getDbConfig = () => {
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://neondb_owner:npg_sdwOblMUk01P@ep-sparkling-firefly-a20g2oj9-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';
  
  return {
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased from 2000ms to 10000ms
  };
};

// Create database connection pool
const pool = new Pool(getDbConfig());

// Database initialization - create tables if they don't exist
const initializeDatabase = async () => {
  const client = await pool.connect();
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        profile_picture TEXT,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_sessions INTEGER DEFAULT 0,
        total_minutes INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        last_session_date TIMESTAMP,
        preferences JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        duration INTEGER NOT NULL,
        frequency VARCHAR(20) NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        xp_gained INTEGER DEFAULT 0,
        session_type VARCHAR(50) DEFAULT 'meditation',
        actual_duration INTEGER,
        paused BOOLEAN DEFAULT false,
        pause_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Groups table
    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        member_count INTEGER DEFAULT 1,
        is_public BOOLEAN DEFAULT false,
        group_code VARCHAR(10) UNIQUE NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Group members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        role VARCHAR(20) DEFAULT 'member',
        UNIQUE(group_id, user_id)
      );
    `);

    // Friendships table
    await client.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id_1 UUID REFERENCES users(id) ON DELETE CASCADE,
        user_id_2 UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id_1, user_id_2)
      );
    `);

    // Achievements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        achievement_id VARCHAR(50) NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions(completed_at);
      CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
      CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_friendships_user_ids ON friendships(user_id_1, user_id_2);
      CREATE INDEX IF NOT EXISTS idx_groups_code ON groups(group_code);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Database utility functions
const db = {
  // Get a client from the pool
  getClient: async () => {
    return await pool.connect();
  },

  // Execute a query
  query: async (text, params) => {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  },

  // Transaction wrapper
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // User operations
  users: {
    // Create user
    create: async (userData) => {
      const { email, passwordHash, displayName } = userData;
      const result = await db.query(
        `INSERT INTO users (email, password_hash, display_name) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [email, passwordHash, displayName]
      );
      return result.rows[0];
    },

    // Find user by email
    findByEmail: async (email) => {
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    },

    // Find user by ID
    findById: async (id) => {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0];
    },

    // Update user
    update: async (id, updates) => {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [id, ...Object.values(updates)];
      
      const result = await db.query(
        `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        values
      );
      return result.rows[0];
    },

    // Get leaderboard
    getLeaderboard: async (limit = 50) => {
      const result = await db.query(
        `SELECT id, display_name, profile_picture, total_minutes, 
                total_sessions, current_streak, level, experience,
                ROW_NUMBER() OVER (ORDER BY total_minutes DESC) as rank
         FROM users 
         WHERE total_sessions > 0
         ORDER BY total_minutes DESC 
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    }
  },

  // Session operations
  sessions: {
    // Create session
    create: async (sessionData) => {
      const { userId, duration, frequency, xpGained, sessionType, actualDuration, paused, pauseCount } = sessionData;
      const result = await db.query(
        `INSERT INTO sessions (user_id, duration, frequency, xp_gained, session_type, actual_duration, paused, pause_count) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [userId, duration, frequency, xpGained, sessionType, actualDuration, paused, pauseCount]
      );
      return result.rows[0];
    },

    // Get user sessions
    getUserSessions: async (userId, limit = 20) => {
      const result = await db.query(
        `SELECT * FROM sessions 
         WHERE user_id = $1 
         ORDER BY completed_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    },

    // Get session stats
    getUserStats: async (userId) => {
      const result = await db.query(
        `SELECT 
           COUNT(*) as total_sessions,
           COALESCE(SUM(duration), 0) as total_minutes,
           COALESCE(SUM(xp_gained), 0) as total_xp,
           MAX(completed_at) as last_session
         FROM sessions 
         WHERE user_id = $1`,
        [userId]
      );
      return result.rows[0];
    }
  },

  // Group operations
  groups: {
    // Create group
    create: async (groupData) => {
      const { name, description, createdBy, isPublic, groupCode } = groupData;
      return await db.transaction(async (client) => {
        // Create group
        const groupResult = await client.query(
          `INSERT INTO groups (name, description, created_by, is_public, group_code) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING *`,
          [name, description, createdBy, isPublic, groupCode]
        );
        
        const group = groupResult.rows[0];
        
        // Add creator as admin member
        await client.query(
          `INSERT INTO group_members (group_id, user_id, role) 
           VALUES ($1, $2, 'admin')`,
          [group.id, createdBy]
        );
        
        return group;
      });
    },

    // Find group by code
    findByCode: async (groupCode) => {
      const result = await db.query(
        'SELECT * FROM groups WHERE group_code = $1',
        [groupCode]
      );
      return result.rows[0];
    },

    // Get user groups
    getUserGroups: async (userId) => {
      const client = await db.getClient();
      try {
        const result = await client.query(
          `SELECT g.*, gm.role, gm.joined_at
           FROM groups g
           JOIN group_members gm ON g.id = gm.group_id
           WHERE gm.user_id = $1
           ORDER BY gm.joined_at DESC`,
          [userId]
        );
        return result.rows;
      } finally {
        client.release();
      }
    },

    async getPublicGroups() {
      const client = await db.getClient();
      try {
        const result = await client.query(
          `SELECT g.*, COUNT(gm.user_id) as actual_member_count
           FROM groups g
           LEFT JOIN group_members gm ON g.id = gm.group_id
           WHERE g.is_public = true
           GROUP BY g.id
           ORDER BY actual_member_count DESC, g.created_at DESC
           LIMIT 50`
        );
        return result.rows;
      } finally {
        client.release();
      }
    },

    // Join group
    joinGroup: async (groupId, userId) => {
      await db.query(
        `INSERT INTO group_members (group_id, user_id) 
         VALUES ($1, $2)
         ON CONFLICT (group_id, user_id) DO NOTHING`,
        [groupId, userId]
      );
      
      // Update member count
      await db.query(
        `UPDATE groups 
         SET member_count = (SELECT COUNT(*) FROM group_members WHERE group_id = $1)
         WHERE id = $1`,
        [groupId]
      );
    },

    // Leave group
    leaveGroup: async (groupId, userId) => {
      await db.query(
        `DELETE FROM group_members 
         WHERE group_id = $1 AND user_id = $2`,
        [groupId, userId]
      );
      
      // Update member count
      await db.query(
        `UPDATE groups 
         SET member_count = (SELECT COUNT(*) FROM group_members WHERE group_id = $1)
         WHERE id = $1`,
        [groupId]
      );
    },

    // Get group leaderboard
    getLeaderboard: async (groupId, limit = 50) => {
      const result = await db.query(
        `SELECT u.id, u.display_name, u.profile_picture, u.total_minutes, 
                u.total_sessions, u.current_streak, u.level, u.experience,
                ROW_NUMBER() OVER (ORDER BY u.total_minutes DESC) as rank
         FROM users u
         JOIN group_members gm ON u.id = gm.user_id
         WHERE gm.group_id = $1 AND u.total_sessions > 0
         ORDER BY u.total_minutes DESC 
         LIMIT $2`,
        [groupId, limit]
      );
      return result.rows;
    }
  },

  // Friend operations
  friends: {
    // Send friend request
    sendRequest: async (fromUserId, toUserId) => {
      const result = await db.query(
        `INSERT INTO friendships (user_id_1, user_id_2, status) 
         VALUES ($1, $2, 'pending') 
         RETURNING *`,
        [fromUserId, toUserId]
      );
      return result.rows[0];
    },

    // Accept friend request
    acceptRequest: async (requestId) => {
      const result = await db.query(
        `UPDATE friendships 
         SET status = 'accepted', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [requestId]
      );
      return result.rows[0];
    },

    // Get user friends
    getFriends: async (userId) => {
      const result = await db.query(
        `SELECT u.id, u.display_name, u.profile_picture, u.level, 
                u.total_sessions, u.total_minutes, u.current_streak,
                f.created_at as friendship_created_at
         FROM users u
         JOIN friendships f ON (
             (f.user_id_1 = $1 AND f.user_id_2 = u.id) OR 
             (f.user_id_2 = $1 AND f.user_id_1 = u.id)
           )
         WHERE u.id != $1 AND f.status = 'accepted'
         ORDER BY u.display_name`,
        [userId]
      );
      return result.rows;
    },

    // Get friend requests
    getRequests: async (userId) => {
      const incoming = await db.query(
        `SELECT f.id, f.created_at, 
                u.id as from_user_id, u.display_name as from_user_name, 
                u.profile_picture as from_user_picture, u.level as from_user_level
         FROM friendships f
         JOIN users u ON f.user_id_1 = u.id
         WHERE f.user_id_2 = $1 AND f.status = 'pending'
         ORDER BY f.created_at DESC`,
        [userId]
      );

      const outgoing = await db.query(
        `SELECT f.id, f.created_at,
                u.id as to_user_id, u.display_name as to_user_name
         FROM friendships f
         JOIN users u ON f.user_id_2 = u.id
         WHERE f.user_id_1 = $1 AND f.status = 'pending'
         ORDER BY f.created_at DESC`,
        [userId]
      );

      return {
        incoming: incoming.rows,
        outgoing: outgoing.rows
      };
    },

    // Remove friend
    removeFriend: async (userId1, userId2) => {
      await db.query(
        `DELETE FROM friendships 
         WHERE (user_id_1 = $1 AND user_id_2 = $2) 
            OR (user_id_1 = $2 AND user_id_2 = $1)`,
        [userId1, userId2]
      );
    },

    // Search users
    searchUsers: async (query, currentUserId, limit = 20) => {
      const result = await db.query(
        `SELECT u.id, u.display_name, u.profile_picture, u.level, u.total_sessions,
                CASE 
                  WHEN f1.id IS NOT NULL OR f2.id IS NOT NULL THEN true 
                  ELSE false 
                END as is_friend,
                CASE 
                  WHEN fp.id IS NOT NULL THEN true 
                  ELSE false 
                END as has_pending_request
         FROM users u
         LEFT JOIN friendships f1 ON (u.id = f1.user_id_1 AND f1.user_id_2 = $2 AND f1.status = 'accepted')
         LEFT JOIN friendships f2 ON (u.id = f2.user_id_2 AND f2.user_id_1 = $2 AND f2.status = 'accepted')
         LEFT JOIN friendships fp ON ((u.id = fp.user_id_1 AND fp.user_id_2 = $2) OR 
                                      (u.id = fp.user_id_2 AND fp.user_id_1 = $2)) 
                                  AND fp.status = 'pending'
         WHERE u.id != $2 
           AND (u.display_name ILIKE $1 OR u.email ILIKE $1)
         ORDER BY u.display_name
         LIMIT $3`,
        [`%${query}%`, currentUserId, limit]
      );
      return result.rows;
    },

    async getFriendsList(userId) {
      const client = await db.getClient();
      try {
        const result = await client.query(
          `SELECT u.id, u.display_name, u.profile_picture, u.level, u.experience,
                  u.total_sessions, u.total_minutes, f.created_at as friendship_created_at
           FROM users u
           JOIN friendships f ON (
             (f.user_id_1 = $1 AND f.user_id_2 = u.id) OR 
             (f.user_id_2 = $1 AND f.user_id_1 = u.id)
           )
           WHERE u.id != $1 AND f.status = 'accepted'
           ORDER BY u.display_name`,
          [userId]
        );
        return result.rows;
      } finally {
        client.release();
      }
    },

    async getFriendRequests(userId) {
      const client = await db.getClient();
      try {
        // Get incoming requests
        const incomingResult = await client.query(
          `SELECT f.id, f.created_at, u.id as requester_user_id, 
                  u.display_name as requester_name, u.email as requester_email,
                  u.profile_picture as requester_profile_picture
           FROM friendships f
           JOIN users u ON f.user_id_1 = u.id
           WHERE f.user_id_2 = $1 AND f.status = 'pending'
           ORDER BY f.created_at DESC`,
          [userId]
        );

        // Get outgoing requests
        const outgoingResult = await client.query(
          `SELECT f.id, f.created_at, u.id as requester_user_id,
                  u.display_name as requester_name, u.email as requester_email,
                  u.profile_picture as requester_profile_picture
           FROM friendships f
           JOIN users u ON f.user_id_2 = u.id
           WHERE f.user_id_1 = $1 AND f.status = 'pending'
           ORDER BY f.created_at DESC`,
          [userId]
        );

        return {
          incoming: incomingResult.rows,
          outgoing: outgoingResult.rows
        };
      } finally {
        client.release();
      }
    },

    // ...existing code...
  }
};

// Helper function to generate UUIDs (fallback for older PostgreSQL)
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
      throw new Error('User with this email already exists');
    }

    const client = await db.getClient();
    try {
      const result = await client.query(
        `INSERT INTO users (email, password_hash, display_name) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [userData.email, userData.passwordHash, userData.displayName]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  // Get user by email
  async getUserByEmail(email) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  // Get user by ID
  async getUserById(userId) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  // Update user profile
  async updateUser(userId, updateData) {
    const allowedFields = ['display_name', 'profile_picture', 'preferences'];
    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${valueIndex}`);
        values.push(value);
        valueIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);
    const client = await db.getClient();
    try {
      const result = await client.query(
        `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${valueIndex} 
         RETURNING *`,
        values
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  // Update user stats after session completion
  async updateUserStats(userId, sessionData) {
    const xpGained = calculateSessionXP(sessionData.duration);
    
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Get current user stats
      const userResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      const user = userResult.rows[0];

      // Calculate new stats
      const newExperience = (user.experience || 0) + xpGained;
      const newLevel = calculateLevel(newExperience);
      const newTotalSessions = (user.total_sessions || 0) + 1;
      const newTotalMinutes = (user.total_minutes || 0) + sessionData.duration;

      // Calculate streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastSessionDate = user.last_session_date ? new Date(user.last_session_date) : null;
      let newStreak = user.current_streak || 0;

      if (lastSessionDate) {
        const daysDiff = Math.floor((today - lastSessionDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          newStreak += 1;
        } else if (daysDiff > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      // Update user stats
      const updatedUser = await client.query(
        `UPDATE users SET 
           experience = $1, 
           level = $2, 
           total_sessions = $3, 
           total_minutes = $4, 
           current_streak = $5, 
           longest_streak = GREATEST(longest_streak, $5),
           last_session_date = CURRENT_DATE,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 
         RETURNING *`,
        [newExperience, newLevel, newTotalSessions, newTotalMinutes, newStreak, userId]
      );

      await client.query('COMMIT');
      return {
        user: updatedUser.rows[0],
        xpGained,
        levelUp: newLevel > (user.level || 1)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get top users for leaderboard
  async getTopUsers(limit = 50) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `SELECT id, display_name, profile_picture, total_minutes, total_sessions, 
                current_streak, level, experience
         FROM users 
         WHERE total_sessions > 0
         ORDER BY experience DESC, total_minutes DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }
};

// SESSION MANAGEMENT FUNCTIONS
const sessionHelpers = {
  // Create a new session
  async createSession(userId, sessionData) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `INSERT INTO sessions (user_id, duration, frequency, session_type, actual_duration, 
                              paused, pause_count, completed_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          userId,
          sessionData.duration,
          sessionData.frequency,
          sessionData.session_type || 'meditation',
          sessionData.actualDuration || sessionData.duration,
          sessionData.paused || false,
          sessionData.pauseCount || 0
        ]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  // Get user session history with statistics
  async getUserSessionHistory(userId) {
    const client = await db.getClient();
    try {
      // Get sessions
      const sessionsResult = await client.query(
        `SELECT * FROM sessions 
         WHERE user_id = $1 
         ORDER BY completed_at DESC`,
        [userId]
      );

      const sessions = sessionsResult.rows;
      const completedSessions = sessions.filter(s => s.completed_at);

      // Calculate statistics
      const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);
      const totalSessions = completedSessions.length;

      // Calculate weekly minutes
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyMinutes = completedSessions
        .filter(s => new Date(s.completed_at) >= oneWeekAgo)
        .reduce((sum, s) => sum + s.duration, 0);

      // Calculate frequency distribution
      const frequencyStats = completedSessions.reduce((stats, session) => {
        stats[session.frequency] = (stats[session.frequency] || 0) + 1;
        return stats;
      }, {});

      return {
        sessions,
        stats: {
          totalSessions,
          totalMinutes,
          weeklyMinutes,
          averageSessionLength: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
          frequencyStats
        }
      };
    } finally {
      client.release();
    }
  },

  // Pause a session
  async pauseSession(sessionId, userId) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `UPDATE sessions 
         SET paused = true, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2 AND completed_at IS NULL
         RETURNING *`,
        [sessionId, userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Session not found or already completed');
      }
      
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  // Resume a session
  async resumeSession(sessionId, userId) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `UPDATE sessions 
         SET paused = false, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2 AND completed_at IS NULL
         RETURNING *`,
        [sessionId, userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Session not found or already completed');
      }
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
};

// SOCIAL FEATURES (Friends & Groups)
const socialHelpers = {
  // Group functions
  groups: {
    async create(creatorId, groupData) {
      const client = await db.getClient();
      try {
        await client.query('BEGIN');

        // Create group
        const groupResult = await client.query(
          `INSERT INTO groups (name, description, created_by, group_code, is_public)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [
            groupData.name,
            groupData.description || '',
            creatorId,
            groupData.code || Math.random().toString(36).substr(2, 8).toUpperCase(),
            groupData.isPublic || false
          ]
        );

        const group = groupResult.rows[0];

        // Add creator as admin member
        await client.query(
          `INSERT INTO group_members (group_id, user_id, role)
           VALUES ($1, $2, 'admin')`,
          [group.id, creatorId]
        );

        await client.query('COMMIT');
        return group;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async join(userId, groupCode) {
      const client = await db.getClient();
      try {
        await client.query('BEGIN');

        // Find group by code
        const groupResult = await client.query(
          'SELECT * FROM groups WHERE group_code = $1',
          [groupCode]
        );

        if (groupResult.rows.length === 0) {
          throw new Error('Group not found');
        }

        const group = groupResult.rows[0];

        // Check if user is already a member
        const memberResult = await client.query(
          'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
          [group.id, userId]
        );

        if (memberResult.rows.length > 0) {
          throw new Error('Already a member of this group');
        }

        // Add user to group
        await client.query(
          `INSERT INTO group_members (group_id, user_id, role)
           VALUES ($1, $2, 'member')`,
          [group.id, userId]
        );

        // Update member count
        await client.query(
          'UPDATE groups SET member_count = member_count + 1 WHERE id = $1',
          [group.id]
        );

        await client.query('COMMIT');
        return group;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async leave(userId, groupId) {
      const client = await db.getClient();
      try {
        await client.query('BEGIN');

        // Remove user from group
        const result = await client.query(
          'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING *',
          [groupId, userId]
        );

        if (result.rows.length === 0) {
          throw new Error('Not a member of this group');
        }

        // Update member count
        await client.query(
          'UPDATE groups SET member_count = member_count - 1 WHERE id = $1',
          [groupId]
        );

        await client.query('COMMIT');
        return { success: true };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async getDetails(groupId, userId) {
      const client = await db.getClient();
      try {
        const result = await client.query(
          `SELECT g.*, 
                  CASE WHEN gm.user_id IS NOT NULL THEN true ELSE false END as is_member,
                  gm.role as user_role
           FROM groups g
           LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = $2
           WHERE g.id = $1`,
          [groupId, userId]
        );

        if (result.rows.length === 0) {
          throw new Error('Group not found');
        }

        return result.rows[0];
      } finally {
        client.release();
      }
    },

    async getLeaderboard(groupId, userId, limit = 20) {
      const client = await db.getClient();
      try {
        // First verify user is member of group
        const memberResult = await client.query(
          'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, userId]
        );

        if (memberResult.rows.length === 0) {
          throw new Error('Not a member of this group');
        }

        // Get group leaderboard
        const result = await client.query(
          `SELECT u.id, u.display_name, u.profile_picture, u.level, u.experience,
                  u.total_sessions, u.total_minutes, u.current_streak,
                  ROW_NUMBER() OVER (ORDER BY u.experience DESC, u.total_minutes DESC) as rank
           FROM users u
           JOIN group_members gm ON u.id = gm.user_id
           WHERE gm.group_id = $1 AND u.total_sessions > 0
           ORDER BY u.experience DESC, u.total_minutes DESC
           LIMIT $2`,
          [groupId, limit]
        );
        return result.rows;
      } finally {
        client.release();
      }
    }
  },

  // Friend functions
  friends: {
    async sendRequest(fromUserId, toUserId) {
      const client = await db.getClient();
      try {
        // Check if friendship already exists
        const existingResult = await client.query(
          `SELECT * FROM friendships 
           WHERE (user_id_1 = $1 AND user_id_2 = $2) 
              OR (user_id_1 = $2 AND user_id_2 = $1)`,
          [fromUserId, toUserId]
        );

        if (existingResult.rows.length > 0) {
          throw new Error('Friendship request already exists or users are already friends');
        }

        const result = await client.query(
          `INSERT INTO friendships (user_id_1, user_id_2, status)
           VALUES ($1, $2, 'pending')
           RETURNING *`,
          [fromUserId, toUserId]
        );

        return result.rows[0];
      } finally {
        client.release();
      }
    },

    async acceptRequest(userId, friendshipId) {
      const client = await db.getClient();
      try {
        const result = await client.query(
          `UPDATE friendships 
           SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND user_id_2 = $2 AND status = 'pending'
           RETURNING *`,
          [friendshipId, userId]
        );

        if (result.rows.length === 0) {
          throw new Error('Friend request not found or already processed');
        }

        return result.rows[0];
      } finally {
        client.release();
      }
    },

    async declineRequest(userId, friendshipId) {
      const client = await db.getClient();
      try {
        const result = await client.query(
          `DELETE FROM friendships 
           WHERE id = $1 AND user_id_2 = $2 AND status = 'pending'
           RETURNING *`,
          [friendshipId, userId]
        );

        if (result.rows.length === 0) {
          throw new Error('Friend request not found');
        }

        return { success: true };
      } finally {
        client.release();
      }
    },

    async removeFriend(userId, friendshipId) {
      const client = await db.getClient();
      try {
        const result = await client.query(
          `DELETE FROM friendships 
           WHERE id = $1 AND (user_id_1 = $2 OR user_id_2 = $2) AND status = 'accepted'
           RETURNING *`,
          [friendshipId, userId]
        );

        if (result.rows.length === 0) {
          throw new Error('Friendship not found');
        }

        return { success: true };
      } finally {
        client.release();
      }
    },

    async searchUsers(query, currentUserId, limit = 20) {
      const client = await db.getClient();
      try {
        const result = await client.query(
          `SELECT u.id, u.display_name, u.profile_picture,
                  CASE 
                    WHEN f1.id IS NOT NULL OR f2.id IS NOT NULL THEN true 
                    ELSE false 
                  END as is_friend,
                  CASE 
                    WHEN fp.id IS NOT NULL THEN true 
                    ELSE false 
                  END as has_pending_request
           FROM users u
           LEFT JOIN friendships f1 ON (u.id = f1.user_id_1 AND f1.user_id_2 = $2 AND f1.status = 'accepted')
           LEFT JOIN friendships f2 ON (u.id = f2.user_id_2 AND f2.user_id_1 = $2 AND f2.status = 'accepted')
           LEFT JOIN friendships fp ON ((u.id = fp.user_id_1 AND fp.user_id_2 = $2) OR 
                                        (u.id = fp.user_id_2 AND fp.user_id_1 = $2)) 
                                    AND fp.status = 'pending'
           WHERE u.id != $2 
             AND (u.display_name ILIKE $1 OR u.email ILIKE $1)
           ORDER BY u.display_name
           LIMIT $3`,
          [`%${query}%`, currentUserId, limit]
        );
        return result.rows;
      } finally {
        client.release();
      }
    },

    async getFriendsList(userId) {
      const client = await db.getClient();
      try {
        const result = await client.query(
          `SELECT u.id, u.display_name, u.profile_picture, u.level, u.experience,
                  u.total_sessions, u.total_minutes, f.created_at as friendship_created_at
           FROM users u
           JOIN friendships f ON (
             (f.user_id_1 = $1 AND f.user_id_2 = u.id) OR 
             (f.user_id_2 = $1 AND f.user_id_1 = u.id)
           )
           WHERE u.id != $1 AND f.status = 'accepted'
           ORDER BY u.display_name`,
          [userId]
        );
        return result.rows;
      } finally {
        client.release();
      }
    },

    async getFriendRequests(userId) {
      const client = await db.getClient();
      try {
        // Get incoming requests
        const incomingResult = await client.query(
          `SELECT f.id, f.created_at, u.id as requester_user_id, 
                  u.display_name as requester_name, u.email as requester_email,
                  u.profile_picture as requester_profile_picture
           FROM friendships f
           JOIN users u ON f.user_id_1 = u.id
           WHERE f.user_id_2 = $1 AND f.status = 'pending'
           ORDER BY f.created_at DESC`,
          [userId]
        );

        // Get outgoing requests
        const outgoingResult = await client.query(
          `SELECT f.id, f.created_at, u.id as requester_user_id,
                  u.display_name as requester_name, u.email as requester_email,
                  u.profile_picture as requester_profile_picture
           FROM friendships f
           JOIN users u ON f.user_id_2 = u.id
           WHERE f.user_id_1 = $1 AND f.status = 'pending'
           ORDER BY f.created_at DESC`,
          [userId]
        );

        return {
          incoming: incomingResult.rows,
          outgoing: outgoingResult.rows
        };
      } finally {
        client.release();
      }
    },

    async getFriendsLeaderboard(userId) {
      const client = await db.getClient();
      try {
        const result = await client.query(
          `SELECT u.id, u.display_name, u.profile_picture, u.level, u.experience,
                  u.total_sessions, u.total_minutes, u.current_streak,
                  ROW_NUMBER() OVER (ORDER BY u.experience DESC, u.total_minutes DESC) as rank
           FROM users u
           JOIN friendships f ON (
             (f.user_id_1 = $1 AND f.user_id_2 = u.id) OR 
             (f.user_id_2 = $1 AND f.user_id_1 = u.id)
           )
           WHERE u.id != $1 AND f.status = 'accepted' AND u.total_sessions > 0
           ORDER BY u.experience DESC, u.total_minutes DESC
           LIMIT 50`,
          [userId]
        );
        return result.rows;
      } finally {
        client.release();
      }
    }

    // ...existing code...
  }
};

// VALIDATION FUNCTIONS
const validators = {
  email: (email) => {
    if (!email) return { valid: false, message: 'Email is required' };
    if (!isValidEmail(email)) return { valid: false, message: 'Invalid email format' };
    return { valid: true };
  },

  displayName: (name) => {
    if (!name) return { valid: false, message: 'Display name is required' };
    if (name.length < 2) return { valid: false, message: 'Display name must be at least 2 characters' };
    if (name.length > 50) return { valid: false, message: 'Display name must be less than 50 characters' };
    return { valid: true };
  },

  sessionData: (data) => {
    const errors = [];
    
    if (!data.duration || data.duration < 1 || data.duration > 120) {
      errors.push('Duration must be between 1 and 120 minutes');
    }
    
    if (!data.frequency || !['alpha', 'theta', 'beta', 'delta'].includes(data.frequency)) {
      errors.push('Invalid frequency selection');
    }

    return {
      valid: errors.length === 0,
      messages: errors
    };
  }
};

// WISDOM QUOTES FUNCTIONS
const wisdomHelpers = {
  async getRandomQuotes(options = {}) {
    const { category = null, limit = 1, userId = null } = options;
    const client = await db.getClient();
    
    try {
      // For now, return some hardcoded quotes since we don't have a quotes table
      const quotes = [
        {
          id: '1',
          text: 'The present moment is the only time over which we have dominion.',
          author: 'Thich Nhat Hanh',
          category: 'mindfulness',
          created_at: new Date().toISOString()
        },
        {
          id: '2', 
          text: 'Meditation is not a way of making your mind quiet. It is a way of entering into the quiet that is already there.',
          author: 'Deepak Chopra',
          category: 'meditation',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          text: 'Peace comes from within. Do not seek it without.',
          author: 'Buddha',
          category: 'peace',
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          text: 'The mind is everything. What you think you become.',
          author: 'Buddha',
          category: 'mindfulness',
          created_at: new Date().toISOString()
        },
        {
          id: '5',
          text: 'Wherever you are, be there totally.',
          author: 'Eckhart Tolle',
          category: 'presence',
          created_at: new Date().toISOString()
        }
      ];

      // Filter by category if provided
      const filteredQuotes = category 
        ? quotes.filter(q => q.category === category)
        : quotes;

      // Shuffle and return requested number
      const shuffled = filteredQuotes.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, limit);
    } finally {
      client.release();
    }
  },

  async getDailyQuote(date) {
    // Use date as seed for consistent daily quote
    const quotes = await this.getRandomQuotes({ limit: 5 });
    const dateNum = new Date(date).getDate();
    return quotes[dateNum % quotes.length];
  },

  async getCategories() {
    return [
      { id: 'mindfulness', name: 'Mindfulness', count: 2 },
      { id: 'meditation', name: 'Meditation', count: 1 },
      { id: 'peace', name: 'Peace', count: 1 },
      { id: 'presence', name: 'Presence', count: 1 }
    ];
  }
};

// LEADERBOARD FUNCTIONS  
const leaderboardHelpers = {
  async getGlobalLeaderboard(options = {}) {
    const { period = 'week', limit = 50, userId = null } = options;
    const client = await db.getClient();
    
    try {
      let whereClause = 'WHERE u.total_sessions > 0';
      let orderClause = 'ORDER BY u.experience DESC, u.total_minutes DESC';
      
      // For period-based leaderboards, we would need session data
      // For now, use overall stats
      const result = await client.query(
        `SELECT u.id, u.display_name, u.profile_picture, u.level, u.experience,
                u.total_sessions, u.total_minutes, u.current_streak,
                ROW_NUMBER() OVER (${orderClause}) as rank
         FROM users u
         ${whereClause}
         ${orderClause}
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } finally {
      client.release();
    }
  },

  async getFriendsLeaderboard(options = {}) {
    const { period = 'week', userId } = options;
    const client = await db.getClient();
    
    try {
      const result = await client.query(
        `SELECT u.id, u.display_name, u.profile_picture, u.level, u.experience,
                u.total_sessions, u.total_minutes, u.current_streak,
                ROW_NUMBER() OVER (ORDER BY u.experience DESC, u.total_minutes DESC) as rank
         FROM users u
         JOIN friendships f ON (
           (f.user_id_1 = $1 AND f.user_id_2 = u.id) OR 
           (f.user_id_2 = $1 AND f.user_id_1 = u.id)
         )
         WHERE u.id != $1 AND f.status = 'accepted' AND u.total_sessions > 0
         ORDER BY u.experience DESC, u.total_minutes DESC
         LIMIT 50`,
        [userId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }
};

// PRESENCE DETECTION FUNCTIONS
const presenceHelpers = {
  async getPresenceSessions(options = {}) {
    const { userId, period = 'day', limit = 100 } = options;
    // For now return empty array - would implement presence tracking here
    return [];
  },

  async createSession(sessionData) {
    // For now return mock ID - would implement presence session creation here  
    return 'presence_session_' + Date.now();
  },

  async getPresenceStats(options = {}) {
    const { userId, period = 'week' } = options;
    // Return mock stats - would implement real presence analytics here
    return {
      average_score: 0.75,
      total_sessions: 0,
      interruption_rate: 0.1,
      improvement_trend: 0.05
    };
  }
};

// GROUP HELPERS (simplified version)
const groupHelpers = {
  async getUserGroups(userId) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `SELECT g.*, gm.role, gm.joined_at
         FROM groups g
         JOIN group_members gm ON g.id = gm.group_id
         WHERE gm.user_id = $1
         ORDER BY gm.joined_at DESC`,
        [userId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  },

  async createGroup(groupData) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `INSERT INTO groups (name, description, created_by, is_public, group_code, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          groupData.name,
          groupData.description,
          groupData.created_by,
          groupData.privacy_level === 'public',
          Math.random().toString(36).substr(2, 8).toUpperCase()
        ]
      );
      return result.rows[0].id;
    } finally {
      client.release();
    }
  },

  async addMember(groupId, userId, role = 'member') {
    const client = await db.getClient();
    try {
      await client.query(
        `INSERT INTO group_members (group_id, user_id, role, joined_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (group_id, user_id) DO NOTHING`,
        [groupId, userId, role]
      );
    } finally {
      client.release();
    }
  },

  async getGroupById(groupId) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM groups WHERE id = $1',
        [groupId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async isGroupMember(groupId, userId) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );
      return result.rows.length > 0;
    } finally {
      client.release();
    }
  },

  async getGroupMemberCount(groupId) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        'SELECT COUNT(*) as count FROM group_members WHERE group_id = $1',
        [groupId]
      );
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  },

  async removeMember(groupId, userId) {
    const client = await db.getClient();
    try {
      await client.query(
        'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );
    } finally {
      client.release();
    }
  },

  async getGroupLeaderboard(groupId, period = 'week') {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `SELECT u.id, u.display_name, u.profile_picture, u.level, u.experience,
                u.total_sessions, u.total_minutes, u.current_streak,
                ROW_NUMBER() OVER (ORDER BY u.experience DESC, u.total_minutes DESC) as rank
         FROM users u
         JOIN group_members gm ON u.id = gm.user_id
         WHERE gm.group_id = $1 AND u.total_sessions > 0
         ORDER BY u.experience DESC, u.total_minutes DESC
         LIMIT 50`,
        [groupId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }
};

// FRIEND HELPERS (simplified version)
const friendHelpers = {
  async getFriends(userId) {
    return await socialHelpers.friends.getFriendsList(userId);
  },

  async getPendingRequests(userId) {
    return await socialHelpers.friends.getFriendRequests(userId);
  },

  async createRequest(fromUserId, toUserId) {
    return await socialHelpers.friends.sendRequest(fromUserId, toUserId);
  },

  async acceptRequest(requestId, userId) {
    return await socialHelpers.friends.acceptRequest(userId, requestId);
  },

  async declineRequest(requestId, userId) {
    return await socialHelpers.friends.declineRequest(userId, requestId);
  },

  async removeFriend(userId, friendId) {
    const client = await db.getClient();
    try {
      await client.query(
        `DELETE FROM friendships 
         WHERE (user_id_1 = $1 AND user_id_2 = $2) 
            OR (user_id_1 = $2 AND user_id_2 = $1)`,
        [userId, friendId]
      );
    } finally {
      client.release();
    }
  },

  async checkFriendship(userId1, userId2) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `SELECT * FROM friendships 
         WHERE (user_id_1 = $1 AND user_id_2 = $2) 
            OR (user_id_1 = $2 AND user_id_2 = $1)`,
        [userId1, userId2]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }
};

// USER HELPERS (updated for auth compatibility)
const userHelpersAuth = {
  async create(userData) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `INSERT INTO users (email, password_hash, display_name, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          userData.email,
          userData.password_hash,
          userData.display_name || userData.username || userData.full_name,
          userData.created_at,
          userData.updated_at
        ]
      );
      return result.rows[0]; // Return full user object, not just ID
    } finally {
      client.release();
    }
  },

  async findByEmail(email) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async findById(id) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async findByUsername(username) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE display_name = $1',
        [username]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async update(id, updateData) {
    const client = await db.getClient();
    try {
      const setClause = Object.keys(updateData)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [id, ...Object.values(updateData)];
      
      const result = await client.query(
        `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
        values
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async updateLastLogin(userId) {
    const client = await db.getClient();
    try {
      await client.query(
        'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
    } finally {
      client.release();
    }
  },

  async updateSessionStats(userId, stats) {
    const client = await db.getClient();
    try {
      await client.query(
        `UPDATE users SET 
           total_sessions = COALESCE(total_sessions, 0) + $2,
           total_minutes = COALESCE(total_minutes, 0) + $3,
           last_session_date = $4,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [userId, stats.total_sessions, stats.total_minutes, stats.last_session_date]
      );
    } finally {
      client.release();
    }
  },

  async searchUsers(query, currentUserId) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `SELECT id, display_name as username, display_name, profile_picture
         FROM users 
         WHERE id != $2 AND display_name ILIKE $1
         ORDER BY display_name
         LIMIT 20`,
        [`%${query}%`, currentUserId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }
};

// SESSION HELPERS (updated for auth compatibility)
const sessionHelpersAuth = {
  async create(sessionData) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `INSERT INTO sessions (user_id, duration, session_type, frequency, completed_at) 
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          sessionData.user_id,
          sessionData.duration,
          sessionData.session_type,
          sessionData.frequency || 'alpha'
        ]
      );
      return result.rows[0].id;
    } finally {
      client.release();
    }
  },

  async getUserSessions(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;
    const client = await db.getClient();
    try {
      const result = await client.query(
        `SELECT * FROM sessions 
         WHERE user_id = $1 
         ORDER BY completed_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      return result.rows;
    } finally {
      client.release();
    }
  },

  async getUserSessionCount(userId) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        'SELECT COUNT(*) as count FROM sessions WHERE user_id = $1',
        [userId]
      );
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  },

  async updatePauseState(sessionId, pauseData) {
    const client = await db.getClient();
    try {
      const setClause = Object.keys(pauseData)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [sessionId, ...Object.values(pauseData)];
      
      await client.query(
        `UPDATE sessions SET ${setClause} WHERE id = $1`,
        values
      );
    } finally {
      client.release();
    }
  }
};

// Initialize database and export helpers
const initDB = async () => {
  await initializeDatabase();
};

// Export all helpers and utilities
module.exports = {
  db,
  pool,
  initDB,
  initializeDatabase: initDB,
  userHelpers: userHelpersAuth, // Use auth-compatible version
  sessionHelpers: sessionHelpersAuth, // Use auth-compatible version
  socialHelpers,
  validators,
  wisdomHelpers,
  leaderboardHelpers,
  presenceHelpers,
  groupHelpers,
  friendHelpers
};
