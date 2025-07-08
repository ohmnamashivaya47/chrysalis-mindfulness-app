import { socialHelpers, initDB } from '../lib/neon-db.js';
import { authUtils, responseHelpers, errorHandler } from '../lib/auth-utils.js';

export const handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return responseHelpers.cors();
  }

  if (event.httpMethod !== 'POST') {
    return responseHelpers.error('Method not allowed', 405);
  }

  try {
    // Initialize database
    await initDB();

    // Authenticate user
    const authUser = await authUtils.authenticateRequest(event);

    // Parse request body
    const { groupCode } = JSON.parse(event.body || '{}');

    if (!groupCode) {
      return responseHelpers.error('Group code is required', 400);
    }

    // Join group
    const group = await socialHelpers.groups.join(authUser.userId, groupCode.trim().toUpperCase());

    return responseHelpers.success({
      group
    }, 'Successfully joined group');

  } catch (error) {
    return errorHandler.handleError(error, 'Join Group');
  }
};
const { verifyToken, createResponse } = require('../lib/auth-utils');

exports.handler = async (event, context) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, null);
  }

  if (event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await verifyToken(event);
    if (!user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    const { groupCode } = JSON.parse(event.body);

    if (!groupCode) {
      return createResponse(400, { error: 'Group code is required' });
    }

    // Find group by code
    const groups = await getBlob('groups') || [];
    const group = groups.find(g => g.code === groupCode.toUpperCase());

    if (!group) {
      return createResponse(404, { error: 'Group not found' });
    }

    // Check if user is already a member
    const groupMembers = await getBlob('group_members') || [];
    const existingMembership = groupMembers.find(m => 
      m.groupId === group.id && m.userId === user.id
    );

    if (existingMembership) {
      return createResponse(400, { error: 'Already a member of this group' });
    }

    // Add user to group
    const membership = {
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId: group.id,
      userId: user.id,
      joinedAt: new Date().toISOString(),
      role: 'member'
    };

    groupMembers.push(membership);
    await setBlob('group_members', groupMembers);

    // Update group member count
    const groupIndex = groups.findIndex(g => g.id === group.id);
    groups[groupIndex] = {
      ...group,
      memberCount: group.memberCount + 1
    };
    await setBlob('groups', groups);

    return createResponse(200, {
      message: 'Successfully joined group',
      group: {
        ...groups[groupIndex],
        role: 'member'
      }
    });

  } catch (error) {
    console.error('Join group error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
