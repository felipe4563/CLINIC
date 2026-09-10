'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeContextValue = { dark: boolean; toggle: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

const KEY = 'novaged_staff_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let initial = false;
    try {
      const saved = localStorage.getItem(KEY);
      initial = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      initial = false;
    }
    setDark(initial);
    document.documentElement.classList.toggle('dark', initial);
  }, []);

  function toggle() {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      try {
        localStorage.setItem(KEY, next ? 'dark' : 'light');
      } catch {
        /* private mode: theme just won't persist */
      }
      return next;
    });
  }

  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
