const { socialHelpers, initDB } = require('./lib/neon-db.js');
const { authUtils, responseHelpers, errorHandler } = require('./lib/auth-utils.js');

const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return responseHelpers.cors();
  if (event.httpMethod !== 'GET') return responseHelpers.error('Method not allowed', 405);

  try {
    await initDB();
    const authUser = await authUtils.authenticateRequest(event);
    const { groupId, limit = '20' } = event.queryStringParameters || {};
    
    if (!groupId) return responseHelpers.error('Group ID is required', 400);
    
    const leaderboard = await socialHelpers.groups.getLeaderboard(groupId, authUser.userId, parseInt(limit, 10));
    return responseHelpers.success({ leaderboard, type: 'group' }, 'Group leaderboard retrieved');
  } catch (error) {
    return errorHandler.handleError(error, 'Get Group Leaderboard');
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

    // Extract group ID from path
    const pathParts = event.path.split('/');
    const groupId = pathParts[pathParts.indexOf('groups') + 1];

    if (!groupId) {
      return createResponse(400, { error: 'Group ID is required' });
    }

    // Check if user is a member of this group
    const groupMembers = await getBlob('group_members') || [];
    const userMembership = groupMembers.find(m => 
      m.groupId === groupId && m.userId === user.id
    );

    if (!userMembership) {
      return createResponse(403, { error: 'You are not a member of this group' });
    }

    // Get all group members
    const allUsers = await getBlob('users') || [];
    const memberIds = groupMembers
      .filter(m => m.groupId === groupId)
      .map(m => m.userId);

    // Build leaderboard data for group members
    const leaderboardData = [];

    for (const userId of memberIds) {
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

        // Get member role
        const membership = groupMembers.find(m => m.groupId === groupId && m.userId === userId);

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
          role: membership?.role,
          isCurrentUser: userData.id === user.id
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
    console.error('Get group leaderboard error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
module.exports = { handler };
