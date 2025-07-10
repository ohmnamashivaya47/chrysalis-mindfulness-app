import { socialHelpers, initDB } from '../lib/neon-db.js';
import { authUtils, responseHelpers, errorHandler } from '../lib/auth-utils.js';

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return responseHelpers.cors();
  if (event.httpMethod !== 'DELETE') return responseHelpers.error('Method not allowed', 405);

  try {
    await initDB();
    const authUser = await authUtils.authenticateRequest(event);
    const { friendshipId } = JSON.parse(event.body || '{}');
    
    if (!friendshipId) return responseHelpers.error('Friendship ID is required', 400);
    
    await socialHelpers.friends.removeFriend(authUser.userId, friendshipId);
    return responseHelpers.success({}, 'Friend removed successfully');
  } catch (error) {
    return errorHandler.handleError(error, 'Remove Friend');
  }
};
const { verifyToken, createResponse } = require('../lib/auth-utils');

exports.handler = async (event, context) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, null);
  }

  if (event.httpMethod !== 'DELETE') {
    return createResponse(405, { error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await verifyToken(event);
    if (!user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    const { friendId } = JSON.parse(event.body);

    if (!friendId) {
      return createResponse(400, { error: 'Friend ID is required' });
    }

    // Get friends list
    const friends = await getBlob('friends') || [];
    
    // Find the friendship
    const friendshipIndex = friends.findIndex(friendship => 
      (friendship.user1Id === user.id && friendship.user2Id === friendId) ||
      (friendship.user1Id === friendId && friendship.user2Id === user.id)
    );

    if (friendshipIndex === -1) {
      return createResponse(404, { error: 'Friendship not found' });
    }

    // Remove the friendship
    const removedFriendship = friends[friendshipIndex];
    friends.splice(friendshipIndex, 1);
    await setBlob('friends', friends);

    return createResponse(200, {
      message: 'Friend removed successfully',
      removedFriendship
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
