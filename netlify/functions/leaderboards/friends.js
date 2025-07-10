import { socialHelpers, userHelpers, initDB } from '../lib/neon-db.js';
import { authUtils, responseHelpers, errorHandler } from '../lib/auth-utils.js';

export const handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return responseHelpers.cors();
  }

  if (event.httpMethod !== 'GET') {
    return responseHelpers.error('Method not allowed', 405);
  }

  try {
    // Initialize database
    await initDB();

    // Authenticate user
    const authUser = await authUtils.authenticateRequest(event);

    // Get friends leaderboard
    const friendsLeaderboard = await socialHelpers.friends.getFriendsLeaderboard(authUser.userId);

    return responseHelpers.success({
      leaderboard: friendsLeaderboard,
      type: 'friends'
    }, 'Friends leaderboard retrieved successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'Get Friends Leaderboard');
  }
};
const { verifyToken, createResponse } = require('../lib/auth-utils');

exports.handler = async (event, context) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, null);
  }

  if (event.httpMethod !== 'GET') {
    return createResponse(405, { error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await verifyToken(event);
    if (!user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    // Get user's friends
    const friends = await getBlob('friends') || [];
    const userFriendships = friends.filter(friendship => 
      friendship.user1Id === user.id || friendship.user2Id === user.id
    );

    // Get friend IDs
    const friendIds = userFriendships.map(friendship => 
      friendship.user1Id === user.id ? friendship.user2Id : friendship.user1Id
    );

    // Include the user themselves
    const allUserIds = [user.id, ...friendIds];

    // Get all users
    const allUsers = await getBlob('users') || [];

    // Build leaderboard data
    const leaderboardData = [];

    for (const userId of allUserIds) {
      const userData = allUsers.find(u => u.id === userId);
      if (userData) {
        // Get user's session data
        const userSessions = await getBlob(`user_sessions:${userId}`) || [];
        const completedSessions = userSessions.filter(s => s.completed);
        
        const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);
        const totalSessions = completedSessions.length;
        
        // Calculate streak
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sortedSessions = completedSessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        
        for (let i = 0; i < sortedSessions.length; i++) {
          const sessionDate = new Date(sortedSessions[i].startTime);
          sessionDate.setHours(0, 0, 0, 0);
          
          const daysDiff = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === currentStreak) {
            currentStreak++;
          } else {
            break;
          }
        }

        // Calculate weekly minutes
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const weeklyMinutes = completedSessions
          .filter(s => new Date(s.startTime) >= oneWeekAgo)
          .reduce((sum, s) => sum + s.duration, 0);

        leaderboardData.push({
          id: userData.id,
          name: userData.name,
          profilePicture: userData.profilePicture,
          level: userData.level || 1,
          xp: userData.xp || 0,
          totalMinutes,
          totalSessions,
          currentStreak,
          weeklyMinutes,
          isCurrentUser: userData.id === user.id,
          isFriend: friendIds.includes(userData.id)
        });
      }
    }

    // Sort by XP (primary) and weekly minutes (secondary)
    leaderboardData.sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      return b.weeklyMinutes - a.weeklyMinutes;
    });

    // Add ranking
    const rankedData = leaderboardData.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    return createResponse(200, {
      leaderboard: rankedData,
      totalUsers: rankedData.length,
      userRank: rankedData.find(u => u.isCurrentUser)?.rank || null
    });

  } catch (error) {
    console.error('Get friends leaderboard error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
