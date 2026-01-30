'use client';

import { useState, useEffect } from 'react';
import SimpleLoader from './SimpleLoader';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ProjectsProvider } from '../contexts/ProjectsContext';
import { CollaborationProvider } from '../contexts/CollaborationContext';
import { BuilderProvider } from '../contexts/BuilderContext';

export default function AppWrapper({ children }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 seconds loading time

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectsProvider>
          <CollaborationProvider>
            <BuilderProvider>
              <SimpleLoader isLoading={isLoading} />
              {!isLoading && children}
            </BuilderProvider>
          </CollaborationProvider>
        </ProjectsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

