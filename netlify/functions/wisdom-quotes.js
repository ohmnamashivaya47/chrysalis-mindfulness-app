// Wisdom Quotes Function using Netlify Blobs
const { getStore } = require('@netlify/blobs');

// Initialize quotes store
const quotesStore = getStore('quotes');

// Sample wisdom quotes for initialization
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
    text: "Peace comes from within. Do not seek it without.",
    author: "Buddha",
    category: "peace",
    tags: ["inner peace", "wisdom", "seeking"]
  },
  {
    id: 'q5',
    text: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.",
    author: "Alan Watts",
    category: "change",
    tags: ["change", "adaptation", "flow"]
  },
  {
    id: 'q6',
    text: "Mindfulness is about being fully awake in our lives. It is about perceiving the exquisite vividness of each moment.",
    author: "Jon Kabat-Zinn",
    category: "mindfulness",
    tags: ["awareness", "vivid", "moment"]
  },
  {
    id: 'q7',
    text: "The best way to live is by not knowing what will happen to you each day.",
    author: "Donald Barthelme",
    category: "uncertainty",
    tags: ["unknown", "living", "surprise"]
  },
  {
    id: 'q8',
    text: "In the midst of winter, I found there was, within me, an invincible summer.",
    author: "Albert Camus",
    category: "resilience",
    tags: ["strength", "inner power", "seasons"]
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

const helpers = {
  async initializeQuotes() {
    try {
      // Check if quotes are already initialized
      const quotesData = await quotesStore.get('daily_quotes');
      if (quotesData) return;

      // Initialize with sample quotes
      await quotesStore.set('daily_quotes', JSON.stringify(sampleQuotes));
    } catch (error) {
      console.error('Error initializing quotes:', error);
    }
  },

  async getDailyQuote() {
    try {
      await this.initializeQuotes();
      const quotesData = await quotesStore.get('daily_quotes');
      const quotes = JSON.parse(quotesData);
      
      // Select quote based on day of year for consistency
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      const selectedQuote = quotes[dayOfYear % quotes.length];
      
      return selectedQuote;
    } catch (error) {
      console.error('Error getting daily quote:', error);
      return sampleQuotes[0]; // Fallback to first quote
    }
  },

  async getAllQuotes() {
    try {
      await this.initializeQuotes();
      const quotesData = await quotesStore.get('daily_quotes');
      return JSON.parse(quotesData);
    } catch (error) {
      console.error('Error getting all quotes:', error);
      return sampleQuotes;
    }
  },

  async getRandomQuote() {
    try {
      const quotes = await this.getAllQuotes();
      const randomIndex = Math.floor(Math.random() * quotes.length);
      return quotes[randomIndex];
    } catch (error) {
      console.error('Error getting random quote:', error);
      return sampleQuotes[0];
    }
  },

  async getQuotesByCategory(category) {
    try {
      const quotes = await this.getAllQuotes();
      return quotes.filter(quote => quote.category === category);
    } catch (error) {
      console.error('Error getting quotes by category:', error);
      return [];
    }
  }
};

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/wisdom-quotes', '');
    const method = event.httpMethod;

    // Get Daily Quote
    if (path === '/daily' && method === 'GET') {
      const dailyQuote = await helpers.getDailyQuote();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: { dailyQuote }
        })
      };
    }

    // Get Random Quote
    if (path === '/random' && method === 'GET') {
      const randomQuote = await helpers.getRandomQuote();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: { quote: randomQuote }
        })
      };
    }

    // Get All Quotes
    if (path === '' && method === 'GET') {
      const quotes = await helpers.getAllQuotes();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: { quotes }
        })
      };
    }

    // Get Quotes by Category
    if (path.startsWith('/category/') && method === 'GET') {
      const category = path.replace('/category/', '');
      const quotes = await helpers.getQuotesByCategory(category);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: { quotes, category }
        })
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Route not found'
      })
    };

  } catch (error) {
    console.error('Wisdom quotes function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};
