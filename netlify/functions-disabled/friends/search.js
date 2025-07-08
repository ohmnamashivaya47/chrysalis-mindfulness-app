import { socialHelpers, initDB } from '../lib/neon-db.js';
import { authUtils, responseHelpers, errorHandler } from '../lib/auth-utils.js';

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return responseHelpers.cors();
  if (event.httpMethod !== 'GET') return responseHelpers.error('Method not allowed', 405);

  try {
    await initDB();
    const authUser = await authUtils.authenticateRequest(event);
    const { q: query, limit = '20' } = event.queryStringParameters || {};
    
    if (!query) return responseHelpers.error('Query parameter is required', 400);
    
    const results = await socialHelpers.friends.searchUsers(query, authUser.userId, parseInt(limit, 10));
    return responseHelpers.success({ users: results }, 'User search completed');
  } catch (error) {
    return errorHandler.handleError(error, 'Search Users');
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

    const urlParams = new URLSearchParams(event.queryStringParameters || {});
    const searchQuery = urlParams.get('q') || '';

    if (searchQuery.length < 2) {
      return createResponse(400, { error: 'Search query must be at least 2 characters' });
    }

    // Get all users
    const allUsers = await getBlob('users') || [];
    
    // Get user's existing friends to exclude them
    const friends = await getBlob('friends') || [];
    const userFriendships = friends.filter(friendship => 
      friendship.user1Id === user.id || friendship.user2Id === user.id
    );
    const friendIds = userFriendships.map(friendship => 
      friendship.user1Id === user.id ? friendship.user2Id : friendship.user1Id
    );

    // Search users by name or email, excluding current user and existing friends
    const searchResults = allUsers
      .filter(u => 
        u.id !== user.id && 
        !friendIds.includes(u.id) &&
        (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         u.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .slice(0, 10) // Limit to 10 results
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        profilePicture: u.profilePicture,
        level: u.level || 1,
        totalSessions: u.totalSessions || 0,
        totalMinutes: u.totalMinutes || 0
      }));

    return createResponse(200, {
      users: searchResults,
      totalResults: searchResults.length
    });

  } catch (error) {
    console.error('Search users error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
