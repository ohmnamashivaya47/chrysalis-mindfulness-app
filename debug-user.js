import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_sdwOblMUk01P@ep-sparkling-firefly-a20g2oj9-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function debugUser() {
  try {
    const client = await pool.connect();
    
    // Get the user we just created
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['test_debug@example.com']
    );
    
    if (result.rows.length > 0) {
      console.log('User found in database:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('User not found');
    }
    
    client.release();
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await pool.end();
  }
}

debugUser();
