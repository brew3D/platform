"use client";

import Link from "next/link";
import styles from "../landing/landing.module.css";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect, useRef } from "react";

export default function PricingPage() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navbarRef = useRef(null);
  const logoRef = useRef(null);
  const navLinksRef = useRef([]);
  const navButtonRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  return (
    <>
      {/* Navbar (reuse landing styles) */}
      <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`} ref={navbarRef}>
        <div className={styles.navContainer}>
          <div className={styles.logo} ref={logoRef}>
            <span className={styles.logoText}>Ruchi AI</span>
            <div className={styles.logoAccent}></div>
          </div>

          <div className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}>
            <Link href="/" className={styles.navLink} ref={el => navLinksRef.current[0] = el}>
              <span className={styles.navText}>Home</span>
              <div className={styles.navUnderline}></div>
            </Link>
            <Link href="/pricing" className={styles.navLink} ref={el => navLinksRef.current[1] = el}>
              <span className={styles.navText}>Pricing</span>
              <div className={styles.navUnderline}></div>
            </Link>
            <Link href="/community" className={styles.navLink} ref={el => navLinksRef.current[2] = el}>
              <span className={styles.navText}>Community</span>
              <div className={styles.navUnderline}></div>
            </Link>
            {user ? (
              <>
                <Link href="/profile" className={styles.navLink}>
                  <span className={styles.navText}>Profile</span>
                  <div className={styles.navUnderline}></div>
                </Link>
                <button className={styles.navLink} onClick={logout} style={{ background: 'transparent', border: 'none' }}>
                  <span className={styles.navText}>Sign Out</span>
                  <div className={styles.navUnderline}></div>
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className={styles.navLink}>
                  <span className={styles.navText}>Sign In</span>
                  <div className={styles.navUnderline}></div>
                </Link>
                <Link href="/auth/signup" className={styles.navButton} ref={navButtonRef}>
                  <span className={styles.buttonText}>Sign Up</span>
                  <div className={styles.buttonGlow}></div>
                </Link>
              </>
            )}
          </div>

          <button 
            className={styles.menuToggle}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>
        </div>
      </nav>

      <section className={styles.pricing}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Early Access Pricing</h2>
          <p className={styles.sectionSubtitle}>
            Start with the free demo, upgrade when you need more power
          </p>
        </div>

        <div className={styles.pricingGrid}>
          <div className={styles.pricingCard}>
            <div className={styles.pricingHeader}>
              <h3 className={styles.pricingTitle}>Free Demo</h3>
              <div className={styles.pricingPrice}>
                <span className={styles.pricingAmount}>$0</span>
                <span className={styles.pricingPeriod}>/month</span>
              </div>
            </div>
            <ul className={styles.pricingFeatures}>
              <li>Basic 3D modeling</li>
              <li>Up to 3 collaborators</li>
              <li>1GB cloud storage</li>
              <li>Basic AI suggestions</li>
              <li>Community support</li>
            </ul>
            <Link href="/editor" className={styles.pricingButton}>
              Get Started
            </Link>
          </div>

          <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
            <div className={styles.pricingBadge}>Most Popular</div>
            <div className={styles.pricingHeader}>
              <h3 className={styles.pricingTitle}>Early Access Pro</h3>
              <div className={styles.pricingPrice}>
                <span className={styles.pricingAmount}>$29</span>
                <span className={styles.pricingPeriod}>/month</span>
              </div>
            </div>
            <ul className={styles.pricingFeatures}>
              <li>Everything in Free</li>
              <li>Up to 10 collaborators</li>
              <li>100GB cloud storage</li>
              <li>Advanced AI assistance</li>
              <li>Cloud rendering</li>
              <li>Priority support</li>
            </ul>
            <Link href="/editor" className={styles.pricingButton}>
              Start Early Access
            </Link>
          </div>

          <div className={styles.pricingCard}>
            <div className={styles.pricingHeader}>
              <h3 className={styles.pricingTitle}>Enterprise</h3>
              <div className={styles.pricingPrice}>
                <span className={styles.pricingAmount}>Custom</span>
                <span className={styles.pricingPeriod}>pricing</span>
              </div>
            </div>
            <ul className={styles.pricingFeatures}>
              <li>Everything in Pro</li>
              <li>Unlimited collaborators</li>
              <li>1TB cloud storage</li>
              <li>Custom AI models</li>
              <li>On-premise deployment</li>
              <li>Custom integrations</li>
              <li>White-label solutions</li>
              <li>24/7 phone support</li>
              <li>SLA guarantees</li>
              <li>Training & onboarding</li>
            </ul>
            <Link href="/editor" className={styles.pricingButton}>
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* Footer (reuse landing styles) */}
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div>
            <div className={styles.logo} style={{ marginBottom: '0.5rem' }}>
              <span className={styles.logoText}>Ruchi AI</span>
              <div className={styles.logoAccent}></div>
            </div>
            <p className={styles.footerText}>Build interactive 3D faster with AI.</p>
          </div>
          <div>
            <h4 className={styles.footerHeading}>Product</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/" className={styles.footerLink}>Home</Link></li>
              <li><Link href="/pricing" className={styles.footerLink}>Pricing</Link></li>
              <li><Link href="/community" className={styles.footerLink}>Community</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={styles.footerHeading}>Company</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/about" className={styles.footerLink}>About</Link></li>
              <li><Link href="/contact" className={styles.footerLink}>Contact</Link></li>
              <li><Link href="/blog" className={styles.footerLink}>Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={styles.footerHeading}>Legal</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/privacy" className={styles.footerLink}>Privacy</Link></li>
              <li><Link href="/terms" className={styles.footerLink}>Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span className={styles.footerCopy}>© {new Date().getFullYear()} Ruchi AI. All rights reserved.</span>
        </div>
      </div>
    </footer>
    </>
  );
}
