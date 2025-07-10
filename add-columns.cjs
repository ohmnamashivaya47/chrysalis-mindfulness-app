// Database migration script to add missing columns
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_sdwOblMUk01P@ep-sparkling-firefly-a20g2oj9-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addMissingColumns() {
  const client = await pool.connect();
  try {
    console.log('Adding missing columns...');
    
    // Add weekly_minutes column if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS weekly_minutes INTEGER DEFAULT 0
    `);
    
    // Add last_week_reset column if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_week_reset DATE
    `);
    
    // Add updated_at column to friendships table if it doesn't exist
    await client.query(`
      ALTER TABLE friendships 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    
    console.log('Successfully added missing columns!');
    
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addMissingColumns();
