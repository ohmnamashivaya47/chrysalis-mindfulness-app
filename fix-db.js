import pkg from 'pg';
const { Pool } = pkg;

async function fixDatabase() {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_sdwOblMUk01P@ep-sparkling-firefly-a20g2oj9-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Drop existing tables if they exist to avoid foreign key issues
    console.log('🗑️ Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS wisdom_quotes CASCADE;');
    await client.query('DROP TABLE IF EXISTS friend_requests CASCADE;');
    await client.query('DROP TABLE IF EXISTS friendships CASCADE;');
    await client.query('DROP TABLE IF EXISTS group_members CASCADE;');
    await client.query('DROP TABLE IF EXISTS groups CASCADE;');
    await client.query('DROP TABLE IF EXISTS sessions CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');
    console.log('✅ Dropped existing tables');
    
    console.log('🔧 Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        profile_picture TEXT,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_sessions INTEGER DEFAULT 0,
        total_minutes INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        last_session_date TIMESTAMP,
        preferences JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created');

    console.log('🔧 Creating sessions table...');
    await client.query(`
      CREATE TABLE sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        duration INTEGER NOT NULL,
        frequency VARCHAR(20) NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        xp_gained INTEGER DEFAULT 0,
        session_type VARCHAR(50) DEFAULT 'meditation',
        actual_duration INTEGER,
        paused BOOLEAN DEFAULT false,
        pause_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Sessions table created');

    console.log('🔧 Creating groups table...');
    await client.query(`
      CREATE TABLE groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        member_count INTEGER DEFAULT 1,
        is_public BOOLEAN DEFAULT false,
        group_code VARCHAR(10) UNIQUE NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Groups table created');

    console.log('🔧 Creating group_members table...');
    await client.query(`
      CREATE TABLE group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        role VARCHAR(20) DEFAULT 'member',
        UNIQUE(group_id, user_id)
      );
    `);
    console.log('✅ Group members table created');

    console.log('🔧 Creating friendships table with correct column names...');
    await client.query(`
      CREATE TABLE friendships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id_1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id_2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'accepted',
        UNIQUE(user_id_1, user_id_2),
        CHECK (user_id_1 != user_id_2)
      );
    `);
    console.log('✅ Friendships table created');

    console.log('🔧 Creating friend_requests table...');
    await client.query(`
      CREATE TABLE friend_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id_1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id_2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id_1, user_id_2),
        CHECK (user_id_1 != user_id_2)
      );
    `);
    console.log('✅ Friend requests table created');

    console.log('🔧 Creating wisdom_quotes table...');
    await client.query(`
      CREATE TABLE wisdom_quotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        text TEXT NOT NULL,
        author VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
    `);
    console.log('✅ Wisdom quotes table created');

    console.log('🔧 Adding some sample wisdom quotes...');
    await client.query(`
      INSERT INTO wisdom_quotes (text, author, category) VALUES
      ('The present moment is the only time over which we have dominion.', 'Thich Nhat Hanh', 'mindfulness'),
      ('Peace comes from within. Do not seek it without.', 'Buddha', 'inner-peace'),
      ('Wherever you are, be there totally.', 'Eckhart Tolle', 'presence'),
      ('The mind is everything. What you think you become.', 'Buddha', 'mindset'),
      ('In the midst of winter, I found there was, within me, an invincible summer.', 'Albert Camus', 'resilience'),
      ('Meditation is not about stopping thoughts, but recognizing that we are more than our thoughts and our feelings.', 'Arianna Huffington', 'meditation'),
      ('The goal of meditation is not to control your thoughts, it is to stop letting them control you.', 'Unknown', 'meditation'),
      ('Breathing in, I calm body and mind. Breathing out, I smile.', 'Thich Nhat Hanh', 'breathing'),
      ('Be yourself and be where you are. That is the spiritual path.', 'Buddha', 'authenticity'),
      ('The quieter you become, the more you are able to hear.', 'Rumi', 'silence')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Sample wisdom quotes added');

    console.log('🔧 Creating indexes for performance...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions(completed_at);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_friendships_user_ids ON friendships(user_id_1, user_id_2);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_friend_requests_user_ids ON friend_requests(user_id_1, user_id_2);');
    console.log('✅ Indexes created');

    client.release();
    console.log('🎉 Database fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixDatabase().catch(console.error);
