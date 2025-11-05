'use client';

import Link from 'next/link';
import { useAuth } from './contexts/AuthContext';
import styles from './not-found.module.css';

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.errorCode}>404</div>
        <h1 className={styles.title}>Seems like you got lost...</h1>
        <p className={styles.description}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className={styles.actions}>
          <Link href="/landing" className={styles.primaryButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2"/>
              <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Go Home
          </Link>
          {user && (
            <Link href="/editor" className={styles.secondaryButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Open Editor
            </Link>
          )}
        </div>
        <div className={styles.helpText}>
          <p>Need help? Check out our <Link href="/landing#features">features</Link> or <Link href="/landing#pricing">pricing</Link>.</p>
        </div>
      </div>
      
      {/* Floating background elements */}
      <div className={styles.floatingElements}>
        <div className={styles.cube}></div>
        <div className={styles.sphere}></div>
        <div className={styles.triangle}></div>
        <div className={styles.ring}></div>
      </div>
    </div>
  );
}
