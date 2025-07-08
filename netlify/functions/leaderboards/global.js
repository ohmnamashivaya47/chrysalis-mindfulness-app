// CHRYSALIS - Global Leaderboard Function
// Returns ranked list of top meditation users globally

import { userHelpers } from '../lib/neon-db.js';
import { responseHelpers, errorHandler } from '../lib/auth-utils.js';

export const handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return responseHelpers.cors();
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return responseHelpers.error('Method not allowed', 405);
  }

  try {
    // Get query parameters
    const { limit = '50' } = event.queryStringParameters || {};
    const limitNumber = parseInt(limit, 10);

    // Validate limit parameter
    if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
      return responseHelpers.error('Limit must be between 1 and 100', 400);
    }

    // Get top users for global leaderboard
    const topUsers = await userHelpers.getTopUsers(limitNumber);

    // Add ranking numbers
    const rankedUsers = topUsers.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      displayName: user.displayName,
      profilePicture: user.profilePicture,
      totalMinutes: user.totalMinutes,
      totalSessions: user.totalSessions,
      currentStreak: user.currentStreak,
      level: user.level,
      experience: user.experience
    }));

    return responseHelpers.success({
      leaderboard: rankedUsers,
      totalUsers: rankedUsers.length,
      type: 'global'
    }, 'Global leaderboard retrieved successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'Global Leaderboard');
  }
};
