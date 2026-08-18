// frontend/tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        // Base pastel palette tokens
        mint: '#B9F0E0',
        sage: '#A4C3B2',
        ivory: '#DED6D1',
        blush: '#EEC6CA',
        rose: '#FFB7C3',
        
        // Dark version accents
        'mint-dark': '#8FD8C3',
        'sage-dark': '#7EA89A',
        'ivory-dark': '#CFC6C2',
        'blush-dark': '#D9AEB5',
        'rose-dark': '#F2A5B3',
        
        // Flat semantic tokens mapping directly to CSS variable definitions
        'primary-bg': 'var(--bg-primary)',
        'secondary-bg': 'var(--bg-secondary)',
        'primary-surface': 'var(--surface-primary)',
        'secondary-surface': 'var(--surface-secondary)',
        'tertiary-surface': 'var(--surface-tertiary)',
        'primary-accent': 'var(--accent-primary)',
        'secondary-accent': 'var(--accent-secondary)',
        'primary-text': 'var(--text-primary)',
        'secondary-text': 'var(--text-secondary)',
        'muted-text': 'var(--text-muted)',
      },
      borderRadius: {
        '3xl': '20px',
        '4xl': '28px',
      },
      boxShadow: {
        'soft-glow': '0 8px 30px rgba(185, 240, 224, 0.15)',
        'premium': '0 10px 40px -10px rgba(164, 195, 178, 0.25)',
        'premium-dark': '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
} satisfies Config
