'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import styles from './auth.module.css';

export default function SigninPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Redirect to editor or dashboard
        router.push('/editor');
      } else {
        setError(result.error || 'Sign in failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth temporarily disabled
  // const handleGoogleSignin = () => {
  //   window.location.href = '/api/auth/google';
  // };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoText}>Ruchi AI</span>
          </Link>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to continue your 3D journey</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className={styles.forgotPassword}>
            <Link href="/auth/forgot-password" className={styles.forgotLink}>
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Google OAuth temporarily disabled */}

        <div className={styles.authFooter}>
          <p>Don't have an account? <Link href="/auth/signup" className={styles.authLink}>Sign up</Link></p>
        </div>
      </div>

      <div className={styles.authBackground}>
        <div className={styles.floatingElement} style={{ '--delay': '0s' }}></div>
        <div className={styles.floatingElement} style={{ '--delay': '1s' }}></div>
        <div className={styles.floatingElement} style={{ '--delay': '2s' }}></div>
        <div className={styles.floatingElement} style={{ '--delay': '3s' }}></div>
      </div>
    </div>
  );
}
