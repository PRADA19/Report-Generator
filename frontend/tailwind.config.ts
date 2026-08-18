// frontend/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
        },
        surface: {
          primary: 'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          tertiary: 'var(--surface-tertiary)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          'primary-hover': 'var(--accent-primary-hover)',
          secondary: 'var(--accent-secondary)',
          'secondary-hover': 'var(--accent-secondary-hover)',
          'secondary-text': 'var(--accent-secondary-text)',
          success: 'var(--accent-success)',
          warning: 'var(--accent-warning)',
          info: 'var(--accent-info)',
          gold: 'var(--accent-gold)',
        },
      },
      borderRadius: {
        '3xl': '20px',
        '4xl': '28px',
      },
      boxShadow: {
        'soft-glow': '0 8px 30px rgba(79, 138, 123, 0.12)',
        'premium': '0 10px 40px -10px rgba(0, 0, 0, 0.08)',
        'premium-dark': '0 10px 40px -10px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
};

export default config;
