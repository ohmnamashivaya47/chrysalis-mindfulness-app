/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CHRYSALIS PRESENCE brand colors
        primary: {
          50: '#f0f9f4',
          100: '#dcf2e4',
          200: '#bce4cc',
          300: '#8dcfab',
          400: '#58b383',
          500: '#359665',
          600: '#267a51',
          700: '#1f6142',
          800: '#1B4332', // Main brand color
          900: '#163a2b',
        },
        background: {
          primary: '#F7F3E9', // Warm beige
          secondary: '#FDFCF7',
        },
        accent: {
          coral: '#FF8A65',
          'coral-light': '#FFAB91',
          'coral-dark': '#FF7043',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'spiritual': ['Crimson Text', 'serif'],
      },
      animation: {
        'breathing': 'breathing 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'ripple': 'ripple 2s ease-out infinite',
      },
      keyframes: {
        breathing: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        ripple: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
