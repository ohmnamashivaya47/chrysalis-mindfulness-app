// CHRYSALIS - Database Wisdom Quotes Function
// Retrieves random wisdom quotes from the database

const { db } = require('./lib/neon-db.js');
const { responseHelpers, errorHandler } = require('./lib/auth-utils.js');

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return responseHelpers.cors();
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return responseHelpers.error('Method not allowed', 405);
  }

  try {
    // Get random wisdom quotes
    const client = await db.getClient();
    try {
      const result = await client.query(
        `SELECT id, text, author, category
         FROM wisdom_quotes 
         WHERE is_active = true
         ORDER BY RANDOM()
         LIMIT 10`
      );

      const quotes = result.rows;
      
      return responseHelpers.success({
        quotes,
        total: quotes.length
      }, 'Wisdom quotes retrieved successfully');
      
    } finally {
      client.release();
    }

  } catch (error) {
    return errorHandler.handleError(error, 'Wisdom Quotes');
  }
};
