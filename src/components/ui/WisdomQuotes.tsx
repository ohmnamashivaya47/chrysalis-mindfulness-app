import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Quote, RefreshCw } from 'lucide-react';

interface WisdomQuote {
  text: string;
  author: string;
  source?: string;
}

interface WisdomQuotesProps {
  className?: string;
}

const defaultQuotes: WisdomQuote[] = [
  {
    text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
    author: "Thich Nhat Hanh"
  },
  {
    text: "Meditation is not about stopping thoughts, but recognizing that we are more than our thoughts and our feelings.",
    author: "Arianna Huffington"
  },
  {
    text: "Your task is not to seek for love, but merely to seek and find all the barriers within yourself that you have built against it.",
    author: "Rumi"
  },
  {
    text: "Peace comes from within. Do not seek it without.",
    author: "Buddha"
  },
  {
    text: "The mind is everything. What you think you become.",
    author: "Buddha"
  },
  {
    text: "Wherever you are, be there totally.",
    author: "Eckhart Tolle"
  },
  {
    text: "The quieter you become, the more you are able to hear.",
    author: "Rumi"
  },
  {
    text: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein"
  },
  {
    text: "The best way to find yourself is to lose yourself in the service of others.",
    author: "Mahatma Gandhi"
  },
  {
    text: "You are not a drop in the ocean, but the entire ocean in each drop.",
    author: "Rumi"
  }
];

export const WisdomQuotes = ({ className = '' }: WisdomQuotesProps) => {
  const [currentQuote, setCurrentQuote] = useState<WisdomQuote>(defaultQuotes[0]);
  const [loading, setLoading] = useState(false);

  // Load a random quote on component mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * defaultQuotes.length);
    setCurrentQuote(defaultQuotes[randomIndex]);
  }, []);

  const getNewQuote = async () => {
    setLoading(true);
    try {
      // Try to fetch from API first
      const response = await fetch('/.netlify/functions/wisdom-quotes');
      if (response.ok) {
        const data = await response.json();
        if (data.quote) {
          setCurrentQuote({
            text: data.quote.text,
            author: data.quote.author,
            source: data.quote.source
          });
        } else {
          // Fallback to local quotes
          const randomIndex = Math.floor(Math.random() * defaultQuotes.length);
          setCurrentQuote(defaultQuotes[randomIndex]);
        }
      } else {
        // Fallback to local quotes
        const randomIndex = Math.floor(Math.random() * defaultQuotes.length);
        setCurrentQuote(defaultQuotes[randomIndex]);
      }
    } catch {
      // Fallback to local quotes
      const randomIndex = Math.floor(Math.random() * defaultQuotes.length);
      setCurrentQuote(defaultQuotes[randomIndex]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <Quote className="text-primary-600 w-6 h-6 flex-shrink-0 mt-1" />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={getNewQuote}
          disabled={loading}
          className="p-2 text-primary-600 hover:bg-primary-100 rounded-full transition-colors disabled:opacity-50"
          aria-label="Get new wisdom quote"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>
      
      <blockquote className="text-primary-800 text-lg font-medium leading-relaxed mb-4 italic">
        "{currentQuote.text}"
      </blockquote>
      
      <div className="flex items-center justify-between">
        <cite className="text-primary-600 font-medium not-italic">
          — {currentQuote.author}
        </cite>
        {currentQuote.source && (
          <span className="text-primary-500 text-sm">
            {currentQuote.source}
          </span>
        )}
      </div>
    </motion.div>
  );
};
