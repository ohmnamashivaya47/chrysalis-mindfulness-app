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

    // Get user's friends list (this would need to be implemented in socialHelpers)
    // For now, return empty array - this function needs to be added to neon-db.js
    const friends = await socialHelpers.friends.getFriendsList(authUser.userId);

    return responseHelpers.success({
      friends
    }, 'Friends list retrieved successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'Get Friends List');
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

    // Get all friends and users
    const friends = await getBlob('friends') || [];
    const allUsers = await getBlob('users') || [];

    // Find user's friendships
    const userFriendships = friends.filter(friendship => 
      friendship.user1Id === user.id || friendship.user2Id === user.id
    );

    // Get friend user details
    const userFriends = [];
    for (const friendship of userFriendships) {
      const friendId = friendship.user1Id === user.id ? friendship.user2Id : friendship.user1Id;
      const friendUser = allUsers.find(u => u.id === friendId);
      
      if (friendUser) {
        // Get friend's stats
        const friendSessions = await getBlob(`user_sessions:${friendId}`) || [];
        const completedSessions = friendSessions.filter(s => s.completed);
        const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);

        userFriends.push({
          id: friendUser.id,
          name: friendUser.name,
          email: friendUser.email,
          profilePicture: friendUser.profilePicture,
          level: friendUser.level || 1,
          xp: friendUser.xp || 0,
          totalSessions: completedSessions.length,
          totalMinutes,
          friendshipCreatedAt: friendship.createdAt
        });
      }
    }

    // Sort by most recent friendship
    userFriends.sort((a, b) => new Date(b.friendshipCreatedAt) - new Date(a.friendshipCreatedAt));

    return createResponse(200, {
      friends: userFriends,
      totalCount: userFriends.length
    });

  } catch (error) {
    console.error('Get friends list error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
module.exports = { handler };
