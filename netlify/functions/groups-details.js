const { socialHelpers, initDB } = require('./lib/neon-db.js');
const { authUtils, responseHelpers, errorHandler } = require('./lib/auth-utils.js');

const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return responseHelpers.cors();
  if (event.httpMethod !== 'GET') return responseHelpers.error('Method not allowed', 405);

  try {
    await initDB();
    const authUser = await authUtils.authenticateRequest(event);
    const { groupId } = event.queryStringParameters || {};
    
    if (!groupId) return responseHelpers.error('Group ID is required', 400);
    
    const group = await socialHelpers.groups.getDetails(groupId, authUser.userId);
    return responseHelpers.success({ group }, 'Group details retrieved');
  } catch (error) {
    return errorHandler.handleError(error, 'Get Group Details');
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

    // Get group data
    const groups = await getBlob('groups') || [];
    const group = groups.find(g => g.id === groupId);

    if (!group) {
      return createResponse(404, { error: 'Group not found' });
    }

    // Check if user is a member of this group
    const groupMembers = await getBlob('group_members') || [];
    const userMembership = groupMembers.find(m => 
      m.groupId === groupId && m.userId === user.id
    );

    if (!userMembership) {
      return createResponse(403, { error: 'You are not a member of this group' });
    }

    // Get all group members with their details
    const allUsers = await getBlob('users') || [];
    const members = [];

    for (const membership of groupMembers.filter(m => m.groupId === groupId)) {
      const memberUser = allUsers.find(u => u.id === membership.userId);
      if (memberUser) {
        // Get member's session stats
        const memberSessions = await getBlob(`user_sessions:${membership.userId}`) || [];
        const completedSessions = memberSessions.filter(s => s.completed);
        const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);

        members.push({
          id: memberUser.id,
          name: memberUser.name,
          email: memberUser.email,
          profilePicture: memberUser.profilePicture,
          level: memberUser.level || 1,
          xp: memberUser.xp || 0,
          totalSessions: completedSessions.length,
          totalMinutes,
          role: membership.role,
          joinedAt: membership.joinedAt,
          isCurrentUser: memberUser.id === user.id
        });
      }
    }

    // Sort members: admins first, then by join date
    members.sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      return new Date(a.joinedAt) - new Date(b.joinedAt);
    });

    // Get group creator info
    const creator = allUsers.find(u => u.id === group.createdBy);

    return createResponse(200, {
      group: {
        ...group,
        creatorName: creator?.name,
        userRole: userMembership.role
      },
      members,
      memberCount: members.length
    });

  } catch (error) {
    console.error('Get group details error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
module.exports = { handler };
