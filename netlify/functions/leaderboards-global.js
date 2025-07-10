// CHRYSALIS - Global Leaderboard Function
// Returns ranked list of top meditation users globally

const { userHelpers } = require('./lib/neon-db.js');
const { responseHelpers, errorHandler } = require('./lib/auth-utils.js');

const handler = async (event, context) => {
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
      display_name: user.display_name,
      profile_picture: user.profile_picture,
      total_minutes: user.total_minutes || 0,
      total_sessions: user.total_sessions || 0,
      weekly_minutes: user.weekly_minutes || 0,
      current_streak: user.current_streak || 0,
      level: user.level || 1,
      experience: user.experience || 0
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
module.exports = { handler };
