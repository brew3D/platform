'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from '../signin/auth.module.css';
import landingStyles from '../../landing/landing.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';

export default function ForgotPasswordPage() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navbarRef = useRef(null);
  const logoRef = useRef(null);
  const navLinksRef = useRef([]);
  const navButtonRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const [step, setStep] = useState('request'); // 'request' | 'verify'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auth/forgot/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      setMessage('If the email exists, an OTP has been sent.');
      setStep('verify');
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      const res = await fetch('/api/auth/forgot/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');
      setMessage('Password reset successful. You can now sign in.');
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Navbar (reuse landing styles) */}
      <nav className={`${landingStyles.navbar} ${scrolled ? landingStyles.navbarScrolled : ''}`} ref={navbarRef}>
        <div className={landingStyles.navContainer}>
          <div className={landingStyles.logo} ref={logoRef}>
            <span className={landingStyles.logoText}>NUVRA</span>
            <div className={landingStyles.logoAccent}></div>
          </div>

          <div className={`${landingStyles.navLinks} ${isMenuOpen ? landingStyles.navLinksOpen : ''}`}>
            <Link href="/" className={landingStyles.navLink} ref={el => navLinksRef.current[0] = el}>
              <span className={landingStyles.navText}>Home</span>
              <div className={landingStyles.navUnderline}></div>
            </Link>
            <Link href="/pricing" className={landingStyles.navLink} ref={el => navLinksRef.current[1] = el}>
              <span className={landingStyles.navText}>Pricing</span>
              <div className={landingStyles.navUnderline}></div>
            </Link>
            <Link href="/community" className={landingStyles.navLink} ref={el => navLinksRef.current[2] = el}>
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
                <Link href="/auth/signup" className={landingStyles.navButton} ref={navButtonRef}>
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
            <span className={styles.logoText}>NUVRA</span>
          </Link>
          <h1 className={styles.title}>Forgot Password</h1>
          <p className={styles.subtitle}>Reset your password using a one-time code</p>
        </div>

        {message && (
          <div className={styles.successMessage}>{message}</div>
        )}
        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequest} className={styles.authForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="Enter your email"
                required
              />
            </div>

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className={styles.authForm}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email</label>
              <input type="email" value={email} readOnly className={styles.input} />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="otp" className={styles.label}>OTP Code</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className={styles.input}
                placeholder="Enter the 6-digit code"
                inputMode="numeric"
                pattern="\\d{6}"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="newPassword" className={styles.label}>New Password</label>
              <div className={styles.inputWithIcon}>
                <input
                  type={showNew ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Enter a new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowNew(prev => !prev)}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <FaRegEyeSlash /> : <FaRegEye />}
                </button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
              <div className={styles.inputWithIcon}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Re-enter the new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowConfirm(prev => !prev)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <FaRegEyeSlash /> : <FaRegEye />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className={styles.authFooter}>
          <p>Remembered? <Link href="/auth/signin" className={styles.authLink}>Back to Sign in</Link></p>
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
                <span className={landingStyles.logoText}>NUVRA</span>
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
            <span className={landingStyles.footerCopy}>© {new Date().getFullYear()} NUVRA. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
}


