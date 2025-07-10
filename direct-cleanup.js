// Direct database cleanup script
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:2GXgqtfcGUJL@ep-nameless-lake-a5gqkb6o.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function cleanupDatabase() {
  const client = await pool.connect();
  try {
    console.log('Starting database cleanup...');
    
    // Delete all data in the correct order (respecting foreign key constraints)
    await client.query('DELETE FROM sessions');
    await client.query('DELETE FROM friendships');
    await client.query('DELETE FROM group_members');
    await client.query('DELETE FROM groups');
    await client.query('DELETE FROM users');
    
    console.log('Database cleanup completed successfully!');
    
    // Verify cleanup
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const sessionCount = await client.query('SELECT COUNT(*) FROM sessions');
    const friendshipCount = await client.query('SELECT COUNT(*) FROM friendships');
    
    console.log(`Remaining records:
    - Users: ${userCount.rows[0].count}
    - Sessions: ${sessionCount.rows[0].count}
    - Friendships: ${friendshipCount.rows[0].count}`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupDatabase();
