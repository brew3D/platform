'use client';

import { useState, useEffect } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import styles from './auth.module.css';
import landingStyles from '../../landing/landing.module.css';

export default function SigninPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

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
        // Redirect to dashboard
        router.push('/dashboard');
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
    <div>
      {/* Navbar (reuse landing styles) */}
      <nav className={`${landingStyles.navbar} ${scrolled ? landingStyles.navbarScrolled : ''}`}>
        <div className={landingStyles.navContainer}>
          <div className={landingStyles.logo}>
            <span className={landingStyles.logoText}>Ruchi AI</span>
            <div className={landingStyles.logoAccent}></div>
          </div>

          <div className={`${landingStyles.navLinks} ${isMenuOpen ? landingStyles.navLinksOpen : ''}`}>
            <Link href="/" className={landingStyles.navLink}>
              <span className={landingStyles.navText}>Home</span>
              <div className={landingStyles.navUnderline}></div>
            </Link>
            <Link href="/pricing" className={landingStyles.navLink}>
              <span className={landingStyles.navText}>Pricing</span>
              <div className={landingStyles.navUnderline}></div>
            </Link>
            <Link href="/community" className={landingStyles.navLink}>
              <span className={landingStyles.navText}>Community</span>
              <div className={landingStyles.navUnderline}></div>
            </Link>
            {user ? (
              <>
                <Link href="/profile" className={landingStyles.navLink}>
                  <span className={landingStyles.navText}>Profile</span>
                  <div className={landingStyles.navUnderline}></div>
                </Link>
                <button className={landingStyles.navLink} onClick={logout} style={{ background: 'transparent', border: 'none' }}>
                  <span className={landingStyles.navText}>Sign Out</span>
                  <div className={landingStyles.navUnderline}></div>
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className={landingStyles.navLink}>
                  <span className={landingStyles.navText}>Sign In</span>
                  <div className={landingStyles.navUnderline}></div>
                </Link>
                <Link href="/auth/signup" className={landingStyles.navButton}>
                  <span className={landingStyles.buttonText}>Sign Up</span>
                  <div className={landingStyles.buttonGlow}></div>
                </Link>
              </>
            )}
          </div>

          <button 
            className={landingStyles.menuToggle}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className={landingStyles.hamburgerLine}></span>
            <span className={landingStyles.hamburgerLine}></span>
            <span className={landingStyles.hamburgerLine}></span>
          </button>
        </div>
      </nav>

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
            <div className={styles.inputWithIcon}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className={styles.eyeToggle}
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </button>
            </div>
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
      {/* Footer (reuse landing styles) */}
      <footer className={landingStyles.footer}>
        <div className={landingStyles.container}>
          <div className={landingStyles.footerGrid}>
            <div>
              <div className={landingStyles.logo} style={{ marginBottom: '0.5rem' }}>
                <span className={landingStyles.logoText}>Ruchi AI</span>
                <div className={landingStyles.logoAccent}></div>
              </div>
              <p className={landingStyles.footerText}>Build interactive 3D faster with AI.</p>
            </div>
            <div>
              <h4 className={landingStyles.footerHeading}>Product</h4>
              <ul className={landingStyles.footerLinks}>
                <li><Link href="/" className={landingStyles.footerLink}>Home</Link></li>
                <li><Link href="/pricing" className={landingStyles.footerLink}>Pricing</Link></li>
                <li><Link href="/community" className={landingStyles.footerLink}>Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className={landingStyles.footerHeading}>Company</h4>
              <ul className={landingStyles.footerLinks}>
                <li><Link href="/about" className={landingStyles.footerLink}>About</Link></li>
                <li><Link href="/contact" className={landingStyles.footerLink}>Contact</Link></li>
                <li><Link href="/blog" className={landingStyles.footerLink}>Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className={landingStyles.footerHeading}>Legal</h4>
              <ul className={landingStyles.footerLinks}>
                <li><Link href="/privacy" className={landingStyles.footerLink}>Privacy</Link></li>
                <li><Link href="/terms" className={landingStyles.footerLink}>Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className={landingStyles.footerBottom}>
            <span className={landingStyles.footerCopy}>© {new Date().getFullYear()} Ruchi AI. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
