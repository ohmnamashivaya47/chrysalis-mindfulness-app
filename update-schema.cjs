const { Pool } = require('pg');

async function updateDatabaseSchema() {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_BmLd4wJUthj8@ep-cold-boat-a5y0lfnk-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected to database');
    
    console.log('Adding missing columns to users table...');
    
    // Add profile_picture column if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_picture TEXT;
    `);
    
    // Add other missing columns that might be needed
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_session_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    
    console.log('Database schema updated successfully');
    client.release();
    
  } catch (error) {
    console.error('Database schema update failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

updateDatabaseSchema();
