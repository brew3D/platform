'use client';

import React, { useState, useEffect } from 'react';
import styles from './offline.module.css';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Redirect to dashboard when back online
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (isOnline) {
    return (
      <div className={styles.offlinePage}>
        <div className={styles.content}>
          <div className={styles.icon}>🌐</div>
          <h1>You're back online!</h1>
          <p>Redirecting you to the dashboard...</p>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.offlinePage}>
      <div className={styles.content}>
        <div className={styles.icon}>📡</div>
        <h1>You're offline</h1>
        <p>It looks like you've lost your internet connection. Don't worry, some features are still available offline.</p>
        
        <div className={styles.features}>
          <h3>Available offline:</h3>
          <ul>
            <li>✅ View cached posts and content</li>
            <li>✅ Read previously loaded pages</li>
            <li>✅ Access your profile</li>
            <li>✅ Browse cached events</li>
            <li>❌ Create new posts (will sync when online)</li>
            <li>❌ Send messages (will sync when online)</li>
            <li>❌ Upload files (will sync when online)</li>
          </ul>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.retryButton}
            onClick={handleRetry}
            disabled={retryCount >= 3}
          >
            {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
          </button>
          
          <button 
            className={styles.homeButton}
            onClick={handleGoHome}
          >
            Go to Home
          </button>
        </div>

        {retryCount > 0 && (
          <div className={styles.retryInfo}>
            <p>Retry attempts: {retryCount}/3</p>
            {retryCount >= 3 && (
              <p className={styles.maxRetries}>
                Maximum retry attempts reached. Please check your internet connection and try again later.
              </p>
            )}
          </div>
        )}

        <div className={styles.tips}>
          <h3>Tips for offline use:</h3>
          <ul>
            <li>Keep the app open to maintain cached content</li>
            <li>Actions performed offline will sync when you're back online</li>
            <li>Check your internet connection and try refreshing the page</li>
            <li>Some features require an active internet connection</li>
          </ul>
        </div>

        <div className={styles.help}>
          <p>Need help? Check our <a href="/help" className={styles.helpLink}>help center</a> or contact support.</p>
        </div>
      </div>
    </div>
  );
}
