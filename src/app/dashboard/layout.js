"use client";

import React from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function DashboardLayout({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
