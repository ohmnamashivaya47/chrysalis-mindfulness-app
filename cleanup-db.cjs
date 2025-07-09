#!/usr/bin/env node

// CHRYSALIS - Database Cleanup Script
// Direct database connection to clean up test users

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://neondb_owner:npg_sdwOblMUk01P@ep-sparkling-firefly-a20g2oj9-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function cleanupTestUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Looking for specific test user IDs from leaderboard...');
    
    // Target specific IDs from leaderboard that are test users
    const testUserIds = [
      'c2f2c8af-d293-47b7-9341-247e32006392', // "Test User" with 600 minutes
      'e465d6fb-21d5-4f6b-9f2b-0fca21800be5'  // "Production Test User" with 300 minutes
    ];
    
    for (const userId of testUserIds) {
      console.log(`Checking user ID: ${userId}`);
      
      const userResult = await client.query(
        'SELECT id, email, display_name, total_minutes FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        console.log(`Found test user: ${user.display_name} (${user.email}) - ${user.total_minutes} minutes`);
        
        console.log(`Deleting user: ${user.display_name}`);
        
        await client.query('BEGIN');
        
        // Delete in order of dependencies
        await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM group_members WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM friendships WHERE user_id_1 = $1 OR user_id_2 = $1', [userId]);
        await client.query('DELETE FROM groups WHERE created_by = $1', [userId]);
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        
        await client.query('COMMIT');
        console.log(`✅ Deleted user: ${user.display_name}`);
      } else {
        console.log(`❌ User ID ${userId} not found`);
      }
    }
    
    console.log('✅ Specific test user cleanup completed');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup
cleanupTestUsers()
  .then(() => {
    console.log('🎉 Database cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });
