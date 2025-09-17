'use client';

import { useState, useEffect } from 'react';
import SimpleLoader from './SimpleLoader';

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
    <>
      <SimpleLoader isLoading={isLoading} />
      {!isLoading && children}
    </>
  );
}
