// frontend/src/components/ui/ThemeToggle.tsx
import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eventflow_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return systemPrefersDark ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('eventflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      onClick={toggleTheme}
      className="glass-panel relative w-14 h-7 rounded-full bg-surface-secondary dark:bg-surface-tertiary p-0.5 flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-primary/20 theme-transition"
      aria-label="Toggle Theme"
    >
      {/* Sliding Thumb */}
      <span 
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-surface-primary shadow-md transform transition-transform duration-300 ${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
        }`}
      />
      {/* Sun/Moon Icons */}
      <Sun className="w-3.5 h-3.5 text-amber-500 ml-1.5 z-10 pointer-events-none" />
      <Moon className="w-3.5 h-3.5 text-blue-400 mr-1.5 z-10 pointer-events-none" />
    </button>
  );
};
export default ThemeToggle;
