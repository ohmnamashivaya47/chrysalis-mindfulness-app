const { socialHelpers, userHelpers, initDB } = require('./lib/neon-db.js');
const { authUtils, responseHelpers, errorHandler } = require('./lib/auth-utils.js');

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

    // Authenticate user
    const authUser = await authUtils.authenticateRequest(event);

    // Get user's friends list
    const friends = await socialHelpers.friends.getFriendsList(authUser.userId);

    // Map to expected format
    const mappedFriends = friends.map(friend => ({
      id: friend.id,
      name: friend.display_name,
      email: friend.email || '',
      profilePicture: friend.profile_picture,
      level: friend.level || 1,
      xp: friend.experience || 0,
      totalSessions: friend.total_sessions || 0,
      totalMinutes: friend.total_minutes || 0,
      friendshipCreatedAt: friend.friendship_created_at
    }));

    return responseHelpers.success({
      friends: mappedFriends
    }, 'Friends list retrieved successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'Get Friends List');
  }
};

module.exports = { handler };
