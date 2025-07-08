// Netlify Function for handling presence sessions with FaunaDB
import jwt from 'jsonwebtoken';
import { createPresenceSession, getUserSessions, updateUserStats } from './lib/fauna';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string>;
  body?: string;
}

interface Session {
  ref: { id: string };
  data: Record<string, unknown>;
}

export const handler = async (event: NetlifyEvent): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { httpMethod, body } = event;
    const authHeader = event.headers.authorization;

    // Verify JWT token for protected routes
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid token' })
        };
      }
    }

    switch (httpMethod) {
      case 'POST': {
        if (!userId) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Authentication required' })
          };
        }

        const sessionData = JSON.parse(body || '{}');
        // Create session in FaunaDB
        const newSession = await createPresenceSession({
          user_id: userId,
          start_time: sessionData.startTime,
          end_time: sessionData.endTime,
          duration_seconds: sessionData.duration,
          session_type: sessionData.sessionType,
          quality_rating: sessionData.qualityRating,
          trigger_type: sessionData.triggerType || 'manual'
        });

        // Update user stats
        if (sessionData.duration) {
          await updateUserStats(userId, {
            total_presence_time: sessionData.duration // This would need to be cumulative in real implementation
          });
        }

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            data: {
              id: newSession.ref.id,
              ...newSession.data
            }
          }),
        };
      }
      case 'GET': {
        if (!userId) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Authentication required' })
          };
        }

        const sessions = await getUserSessions(userId);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: (sessions.data as Session[]).map((session) => ({
              id: session.ref.id,
              ...session.data
            }))
          }),
        };
      }
      default: {
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({
            error: 'Method not allowed'
          }),
        };
      }
    }
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error'
      }),
    };
  }
};
