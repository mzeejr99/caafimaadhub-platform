import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();
const THEME_STORAGE_KEY = 'caafimaad_theme_v6';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      // Clean up all legacy theme keys
      ['caafimaad_theme', 'caafimaad_theme_v2', 'caafimaad_theme_v3', 'caafimaad_theme_v4', 'caafimaad_theme_v5'].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });

      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch (e) {
      console.error('Error reading theme from localStorage', e);
    }
    // Strict default to light (white mode)
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.error('Error saving theme to localStorage', e);
    }

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return { theme: 'light', setTheme: () => {}, toggleTheme: () => {}, isDark: false };
  }
  return context;
}


