// CHRYSALIS - Admin Routes for Database Cleanup
// Temporary admin endpoint for cleaning test data

const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

// Database connection (reuse existing config)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://neondb_owner:npg_sdwOblMUk01P@ep-sparkling-firefly-a20g2oj9-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// DELETE /api/admin/cleanup-test-users
router.delete('/cleanup-test-users', async (req, res) => {
  try {
    const { adminKey } = req.body;
    
    // Simple admin key check
    if (adminKey !== 'CLEANUP_TEST_DATA_2025') {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin key'
      });
    }

    const client = await pool.connect();
    
    try {
      // Find test users
      const testUsersResult = await client.query(
        `SELECT id, email, display_name, total_minutes 
         FROM users 
         WHERE email LIKE '%test%' 
            OR display_name ILIKE '%test%' 
            OR display_name ILIKE '%production%'
            OR total_minutes > 500
         ORDER BY created_at DESC`
      );
      
      const testUsers = testUsersResult.rows;
      
      if (testUsers.length === 0) {
        return res.json({
          success: true,
          message: 'No test users found to delete'
        });
      }

      // Delete test users and their associated data
      await client.query('BEGIN');
      
      for (const user of testUsers) {
        // Delete in order of dependencies
        await client.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);
        await client.query('DELETE FROM group_members WHERE user_id = $1', [user.id]);
        await client.query('DELETE FROM friendships WHERE user_id_1 = $1 OR user_id_2 = $1', [user.id]);
        await client.query('DELETE FROM groups WHERE created_by = $1', [user.id]);
        await client.query('DELETE FROM users WHERE id = $1', [user.id]);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Successfully deleted ${testUsers.length} test users`,
        deletedUsers: testUsers.map(u => ({ id: u.id, email: u.email, displayName: u.display_name }))
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Cleanup test users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup test users',
      message: error.message
    });
  }
});

module.exports = router;
