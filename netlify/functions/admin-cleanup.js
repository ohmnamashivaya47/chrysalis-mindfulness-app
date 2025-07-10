// CHRYSALIS - Database Cleanup Function (for testing only)
// Removes all test data from the database

const { initDB } = require('./lib/neon-db.js');
const { responseHelpers, errorHandler } = require('./lib/auth-utils.js');

const handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return responseHelpers.cors();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return responseHelpers.error('Method not allowed', 405);
  }

  try {
    // Initialize database
    await initDB();
    
    // For security, only allow cleanup if a special token is provided
    const { cleanupToken } = JSON.parse(event.body || '{}');
    if (cleanupToken !== 'CHRYSALIS_CLEANUP_2024') {
      return responseHelpers.error('Unauthorized cleanup attempt', 403);
    }

    const { Pool } = require('pg');
    const getDbConfig = () => {
      const connectionString = process.env.DATABASE_URL || 
        'postgresql://neondb_owner:npg_sdwOblMUk01P@ep-sparkling-firefly-a20g2oj9-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';
      
      return {
        connectionString,
        ssl: {
          rejectUnauthorized: false
        }
      };
    };

    const pool = new Pool(getDbConfig());
    const client = await pool.connect();

    try {
      // Delete all test data (cascade will handle related records)
      await client.query('DELETE FROM sessions');
      await client.query('DELETE FROM friendships');
      await client.query('DELETE FROM group_members');
      await client.query('DELETE FROM groups');
      await client.query('DELETE FROM achievements');
      await client.query('DELETE FROM users');

      console.log('Database cleanup completed successfully');
      
      return responseHelpers.success({
        message: 'All test data has been cleared'
      }, 'Database cleanup completed');

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    return errorHandler.handleError(error, 'Database Cleanup');
  }
};

module.exports = { handler };
