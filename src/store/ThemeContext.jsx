"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  darkMode: false,
  toggleTheme: () => { },
});

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('civifix_theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark', 'dark-mode');
    } else {
      document.documentElement.classList.remove('dark', 'dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark', 'dark-mode');
        localStorage.setItem('civifix_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark', 'dark-mode');
        localStorage.setItem('civifix_theme', 'light');
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
