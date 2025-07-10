// FaunaDB client configuration for CHRYSALIS PRESENCE
const faunadb = require('faunadb')

const q = faunadb.query

// Initialize FaunaDB client
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET_KEY,
  domain: 'db.fauna.com',
  scheme: 'https',
})

// Database schemas and helpers
const collections = {
  users: 'users',
  presence_sessions: 'presence_sessions',
  wisdom_quotes: 'wisdom_quotes',
  friendships: 'friendships',
  user_stats: 'user_stats'
}

const indexes = {
  users_by_email: 'users_by_email',
  sessions_by_user: 'sessions_by_user',
  active_quotes: 'active_quotes'
}

// Helper functions
const createUser = async (userData) => {
  try {
    const result = await client.query(
      q.Create(q.Collection(collections.users), {
        data: {
          ...userData,
          created_at: q.Now(),
          total_presence_time: 0,
          current_streak: 0,
          privacy_level: 'friends'
        }
      })
    )
    return result
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }
}

const getUserByEmail = async (email) => {
  try {
    const result = await client.query(
      q.Get(q.Match(q.Index(indexes.users_by_email), email))
    )
    return result
  } catch (error) {
    if (error.name === 'NotFound') {
      return null
    }
    throw error
  }
}

const createPresenceSession = async (sessionData) => {
  try {
    const result = await client.query(
      q.Create(q.Collection(collections.presence_sessions), {
        data: {
          ...sessionData,
          created_at: q.Now()
        }
      })
    )
    return result
  } catch (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }
}

const getUserSessions = async (userId) => {
  try {
    const result = await client.query(
      q.Map(
        q.Paginate(q.Match(q.Index(indexes.sessions_by_user), userId)),
        q.Lambda('ref', q.Get(q.Var('ref')))
      )
    )
    return result
  } catch (error) {
    throw new Error(`Failed to get sessions: ${error.message}`)
  }
}

const getRandomQuote = async () => {
  try {
    const result = await client.query(
      q.Map(
        q.Paginate(q.Match(q.Index(indexes.active_quotes))),
        q.Lambda('ref', q.Get(q.Var('ref')))
      )
    )
    
    if (result.data.length === 0) {
      return null
    }
    
    // Get random quote
    const randomIndex = Math.floor(Math.random() * result.data.length)
    return result.data[randomIndex]
  } catch (error) {
    throw new Error(`Failed to get quote: ${error.message}`)
  }
}

const updateUserStats = async (userId, updates) => {
  try {
    const result = await client.query(
      q.Update(q.Ref(q.Collection(collections.users), userId), {
        data: updates
      })
    )
    return result
  } catch (error) {
    throw new Error(`Failed to update user stats: ${error.message}`)
  }
}

module.exports = {
  client,
  q,
  collections,
  indexes,
  createUser,
  getUserByEmail,
  createPresenceSession,
  getUserSessions,
  getRandomQuote,
  updateUserStats
}
