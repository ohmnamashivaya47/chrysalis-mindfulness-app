const { userHelpers, initDB } = require('./lib/neon-db.js');
const { responseHelpers, errorHandler } = require('./lib/auth-utils.js');

const handler = async (event, context) => {
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

    // Get query parameters
    const { limit = '50' } = event.queryStringParameters || {};
    const limitNumber = parseInt(limit, 10);

    // Validate limit parameter
    if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
      return responseHelpers.error('Limit must be between 1 and 100', 400);
    }

    // For now, local leaderboard is same as global
    // In future, could filter by location/timezone
    const topUsers = await userHelpers.getTopUsers(limitNumber);

    // Add ranking numbers
    const rankedUsers = topUsers.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      displayName: user.display_name,
      profilePicture: user.profile_picture,
      totalMinutes: user.total_minutes,
      totalSessions: user.total_sessions,
      currentStreak: user.current_streak,
      level: user.level,
      experience: user.experience
    }));

    return responseHelpers.success({
      leaderboard: rankedUsers,
      totalUsers: rankedUsers.length,
      type: 'local'
    }, 'Local leaderboard retrieved successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'Get Local Leaderboard');
  }
};
const { verifyToken, createResponse } = require('./lib/auth-utils');

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

    // For now, implement a simple local leaderboard
    // In a real app, you'd filter by geographic location
    // This returns top users excluding friends for variety

    // Get user's friends to exclude them from local
    const friends = await getBlob('friends') || [];
    const userFriendships = friends.filter(friendship => 
      friendship.user1Id === user.id || friendship.user2Id === user.id
    );

    const friendIds = userFriendships.map(friendship => 
      friendship.user1Id === user.id ? friendship.user2Id : friendship.user1Id
    );

    // Get all users
    const allUsers = await getBlob('users') || [];

    // Filter out friends and current user to simulate "local" users
    const localUsers = allUsers.filter(u => 
      u.id !== user.id && !friendIds.includes(u.id)
    );

    // Build leaderboard data for local users + current user
    const leaderboardData = [];

    // Add current user
    const userSessions = await getBlob(`user_sessions:${user.id}`) || [];
    const userCompletedSessions = userSessions.filter(s => s.completed);
    const userTotalMinutes = userCompletedSessions.reduce((sum, s) => sum + s.duration, 0);

    // Calculate user's weekly minutes
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const userWeeklyMinutes = userCompletedSessions
      .filter(s => new Date(s.startTime) >= oneWeekAgo)
      .reduce((sum, s) => sum + s.duration, 0);

    leaderboardData.push({
      id: user.id,
      name: user.name,
      profilePicture: user.profilePicture,
      level: user.level || 1,
      xp: user.xp || 0,
      totalMinutes: userTotalMinutes,
      totalSessions: userCompletedSessions.length,
      weeklyMinutes: userWeeklyMinutes,
      isCurrentUser: true
    });

    // Add local users (limit to top 20 to avoid large response)
    const localUsersLimited = localUsers.slice(0, 20);

    for (const userData of localUsersLimited) {
      const userSessions = await getBlob(`user_sessions:${userData.id}`) || [];
      const completedSessions = userSessions.filter(s => s.completed);
      
      const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);
      
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
        totalSessions: completedSessions.length,
        weeklyMinutes,
        isCurrentUser: false
      });
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
    console.error('Get local leaderboard error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
module.exports = { handler };
