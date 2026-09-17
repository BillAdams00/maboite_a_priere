'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('mbap_theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('mbap_theme', nextTheme);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-bordure/60 bg-surface/50" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-xl border border-bordure hover:border-primaire/40 bg-surface flex items-center justify-center text-encre-douce hover:text-encre transition-colors shadow-xs"
      aria-label={theme === 'dark' ? 'Basculer en mode jour' : 'Basculer en mode nuit profonde'}
      title={theme === 'dark' ? 'Passer en mode jour' : 'Passer en mode nuit profonde'}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -30, opacity: 0, scale: 0.8 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 30, opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
      >
        {theme === 'dark' ? (
          <Moon size={17} className="text-lumiere" />
        ) : (
          <Sun size={17} className="text-encre-douce" />
        )}
      </motion.div>
    </button>
  );
}
