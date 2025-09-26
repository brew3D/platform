"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Save theme to localStorage
      localStorage.setItem('theme', theme);
      
      // Apply theme to document
      document.documentElement.setAttribute('data-theme', theme);
      
      // Update CSS custom properties
      const root = document.documentElement;
      if (theme === 'dark') {
        root.style.setProperty('--background', '#0a0a0a');
        root.style.setProperty('--foreground', '#ffffff');
        root.style.setProperty('--card-background', 'rgba(255, 255, 255, 0.05)');
        root.style.setProperty('--card-border', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)');
        root.style.setProperty('--text-muted', 'rgba(255, 255, 255, 0.5)');
        root.style.setProperty('--accent', '#8a2be2');
        root.style.setProperty('--accent-hover', '#9d3be8');
        root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, #8a2be2, #667eea)');
        root.style.setProperty('--gradient-bg', 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)');
        root.style.setProperty('--shadow', '0 8px 32px rgba(0, 0, 0, 0.3)');
        root.style.setProperty('--shadow-hover', '0 12px 40px rgba(0, 0, 0, 0.4)');
      } else {
        root.style.setProperty('--background', '#ffffff');
        root.style.setProperty('--foreground', '#1a1a2e');
        root.style.setProperty('--card-background', '#ffffff');
        root.style.setProperty('--card-border', 'rgba(138, 43, 226, 0.15)');
        root.style.setProperty('--text-primary', '#1a1a2e');
        root.style.setProperty('--text-secondary', '#666666');
        root.style.setProperty('--text-muted', '#999999');
        root.style.setProperty('--accent', '#8a2be2');
        root.style.setProperty('--accent-hover', '#9d3be8');
        root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, #8a2be2, #667eea)');
        root.style.setProperty('--gradient-bg', 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)');
        root.style.setProperty('--shadow', '0 4px 18px rgba(0, 0, 0, 0.06)');
        root.style.setProperty('--shadow-hover', '0 12px 34px rgba(138, 43, 226, 0.14)');
      }
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    toggleTheme,
    mounted,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
