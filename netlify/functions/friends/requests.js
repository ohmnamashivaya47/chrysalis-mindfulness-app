import { socialHelpers, initDB } from '../lib/neon-db.js';
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

    // Get friend requests
    const requests = await socialHelpers.friends.getFriendRequests(authUser.userId);

    return responseHelpers.success(requests, 'Friend requests retrieved successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'Get Friend Requests');
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

    // Get friend requests
    const friendRequests = await getBlob('friend_requests') || [];
    const allUsers = await getBlob('users') || [];

    // Find pending requests sent to this user
    const incomingRequests = friendRequests
      .filter(req => req.requestedUserId === user.id && req.status === 'pending')
      .map(req => {
        const requester = allUsers.find(u => u.id === req.requesterUserId);
        return {
          id: req.id,
          requesterUserId: req.requesterUserId,
          requesterName: requester?.name || req.requesterName,
          requesterEmail: requester?.email || req.requesterEmail,
          requesterProfilePicture: requester?.profilePicture,
          createdAt: req.createdAt
        };
      });

    // Find pending requests sent by this user
    const outgoingRequests = friendRequests
      .filter(req => req.requesterUserId === user.id && req.status === 'pending')
      .map(req => {
        const requested = allUsers.find(u => u.id === req.requestedUserId);
        return {
          id: req.id,
          requestedUserId: req.requestedUserId,
          requestedName: requested?.name,
          requestedEmail: requested?.email,
          requestedProfilePicture: requested?.profilePicture,
          createdAt: req.createdAt
        };
      });

    return createResponse(200, {
      incomingRequests: incomingRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      outgoingRequests: outgoingRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      totalIncoming: incomingRequests.length,
      totalOutgoing: outgoingRequests.length
    });

  } catch (error) {
    console.error('Get friend requests error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
