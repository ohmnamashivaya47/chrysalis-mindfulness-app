// Wisdom Quotes Function - Simple in-memory implementation
// Sample wisdom quotes for the app
const sampleQuotes = [
  {
    id: 'q1',
    text: "Between stimulus and response there is a space. In that space is our power to choose our response. In our response lies our growth and our freedom.",
    author: "Viktor Frankl",
    category: "mindfulness",
    tags: ["choice", "freedom", "growth"]
  },
  {
    id: 'q2',
    text: "The present moment is the only time over which we have dominion.",
    author: "Thích Nhất Hạnh",
    category: "presence",
    tags: ["present", "awareness", "control"]
  },
  {
    id: 'q3',
    text: "Wherever you are, be there totally. If you find your here and now intolerable and it makes you unhappy, you have three options: remove yourself from the situation, change it, or accept it totally.",
    author: "Eckhart Tolle",
    category: "presence",
    tags: ["acceptance", "here", "now"]
  },
  {
    id: 'q4',
    text: "The mind is everything. What you think you become.",
    author: "Buddha",
    category: "mindfulness",
    tags: ["mind", "thoughts", "becoming"]
  },
  {
    id: 'q5',
    text: "Peace comes from within. Do not seek it without.",
    author: "Buddha",
    category: "inner peace",
    tags: ["peace", "inner", "seeking"]
  },
  {
    id: 'q6',
    text: "You are the sky, everything else is just the weather.",
    author: "Pema Chödrön",
    category: "perspective",
    tags: ["sky", "weather", "perspective"]
  },
  {
    id: 'q7',
    text: "The only way out is through.",
    author: "Robert Frost",
    category: "perseverance",
    tags: ["way", "through", "perseverance"]
  },
  {
    id: 'q8',
    text: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein",
    category: "opportunity",
    tags: ["difficulty", "opportunity", "challenges"]
  },
  {
    id: 'q9',
    text: "The wound is the place where the Light enters you.",
    author: "Rumi",
    category: "healing",
    tags: ["wounds", "light", "transformation"]
  },
  {
    id: 'q10',
    text: "Yesterday is history, tomorrow is a mystery, today is a gift. That's why it's called the present.",
    author: "Eleanor Roosevelt",
    category: "presence",
    tags: ["today", "gift", "present"]
  }
];

// Get daily quote based on current date
function getDailyQuote() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (24 * 60 * 60 * 1000));
  const quoteIndex = dayOfYear % sampleQuotes.length;
  return sampleQuotes[quoteIndex];
}

// Get random quote
function getRandomQuote() {
  const randomIndex = Math.floor(Math.random() * sampleQuotes.length);
  return sampleQuotes[randomIndex];
}

// Main handler
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const path = event.path || '';
    const method = event.httpMethod;

    if (method === 'GET' && path.includes('/daily')) {
      // Get daily quote
      const quote = getDailyQuote();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(quote)
      };
    } else if (method === 'GET' && path.includes('/random')) {
      // Get random quote
      const quote = getRandomQuote();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(quote)
      };
    } else if (method === 'GET') {
      // Default: get daily quote
      const quote = getDailyQuote();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(quote)
      };
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
