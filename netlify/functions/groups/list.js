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

    // Get user's groups and public groups
    const userGroups = await socialHelpers.groups.getUserGroups(authUser.userId);
    const publicGroups = await socialHelpers.groups.getPublicGroups();

    return responseHelpers.success({
      userGroups,
      publicGroups
    }, 'Groups retrieved successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'Get Groups');
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

    // Get user's group memberships
    const groupMembers = await getBlob('group_members') || [];
    const userMemberships = groupMembers.filter(m => m.userId === user.id);

    if (userMemberships.length === 0) {
      return createResponse(200, {
        groups: [],
        totalCount: 0
      });
    }

    // Get group details
    const groups = await getBlob('groups') || [];
    const allUsers = await getBlob('users') || [];

    const userGroups = [];

    for (const membership of userMemberships) {
      const group = groups.find(g => g.id === membership.groupId);
      if (group) {
        // Get group creator info
        const creator = allUsers.find(u => u.id === group.createdBy);

        // Get member count and recent activity
        const groupMembersList = groupMembers.filter(m => m.groupId === group.id);
        
        // Get recent group activity (sessions from members)
        let recentSessions = 0;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        for (const member of groupMembersList) {
          const memberSessions = await getBlob(`user_sessions:${member.userId}`) || [];
          const weeklySessionsCount = memberSessions.filter(s => 
            s.completed && new Date(s.startTime) >= oneWeekAgo
          ).length;
          recentSessions += weeklySessionsCount;
        }

        userGroups.push({
          id: group.id,
          name: group.name,
          description: group.description,
          code: group.code,
          createdBy: group.createdBy,
          createdAt: group.createdAt,
          memberCount: group.memberCount,
          isPublic: group.isPublic,
          role: membership.role,
          joinedAt: membership.joinedAt,
          creatorName: creator?.name,
          recentActivity: recentSessions
        });
      }
    }

    // Sort by most recently joined
    userGroups.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));

    return createResponse(200, {
      groups: userGroups,
      totalCount: userGroups.length
    });

  } catch (error) {
    console.error('Get user groups error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
