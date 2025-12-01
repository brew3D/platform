'use client';

import { useEffect, useState } from 'react';
import styles from './SimpleLoader.module.css';

export default function SimpleLoader({ isLoading = true, delay = 0 }) {
  const [showLoader, setShowLoader] = useState(isLoading);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setShowLoader(isLoading);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(isLoading);
    }
  }, [isLoading, delay]);

  if (!showLoader) return null;

  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderContainer}>
        <div className={styles.logo}>
          <span className={styles.logoText}>Brew3D</span>
        </div>
        <div className={styles.spinner}></div>
        <div className={styles.loadingText}>Loading...</div>
      </div>
    </div>
  );
}
