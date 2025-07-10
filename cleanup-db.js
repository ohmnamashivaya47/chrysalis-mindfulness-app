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
    console.log('🔍 Finding test users...');
    
    // Find test users
    const testUsersResult = await client.query(`
      SELECT id, email, display_name, total_minutes, total_sessions
      FROM users 
      WHERE email LIKE '%test%' 
         OR display_name ILIKE '%test%' 
         OR display_name ILIKE '%production%'
         OR total_minutes > 500
      ORDER BY created_at DESC
    `);
    
    const testUsers = testUsersResult.rows;
    
    if (testUsers.length === 0) {
      console.log('✅ No test users found to delete');
      return;
    }

    console.log(`Found ${testUsers.length} test users:`);
    testUsers.forEach(user => {
      console.log(`- ${user.display_name} (${user.email}) - ${user.total_minutes} minutes, ${user.total_sessions} sessions`);
    });

    console.log('\n🗑️ Deleting test users and their data...');
    
    await client.query('BEGIN');
    
    for (const user of testUsers) {
      console.log(`Deleting user: ${user.display_name}`);
      
      // Delete in order of dependencies
      await client.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);
      await client.query('DELETE FROM group_members WHERE user_id = $1', [user.id]);
      await client.query('DELETE FROM friendships WHERE user_id_1 = $1 OR user_id_2 = $1', [user.id]);
      await client.query('DELETE FROM groups WHERE created_by = $1', [user.id]);
      await client.query('DELETE FROM users WHERE id = $1', [user.id]);
    }
    
    await client.query('COMMIT');
    
    console.log(`✅ Successfully deleted ${testUsers.length} test users and their data`);
    
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
