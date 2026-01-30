"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import landingStyles from "../landing/landing.module.css";
import styles from "./community.module.css";
import { pillars } from "./data";

export default function CommunityPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navbarRef = useRef(null);
  const navLinksRef = useRef([]);
  const navButtonRef = useRef(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest(".profileContainer")) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showProfileDropdown]);

  return (
    <div className={styles.community} id="community">
      <nav className={`${landingStyles.navbar} ${scrolled ? landingStyles.navbarScrolled : ""}`} ref={navbarRef}>
        <div className={landingStyles.navContainer}>
          <div className={landingStyles.logo}>
            <img src="/brew3d-logo.png" alt="Brew3D" className={landingStyles.logoImage} />
            <span className={landingStyles.logoText}>Brew3D</span>
            <div className={landingStyles.logoAccent}></div>
          </div>

          <div className={`${landingStyles.navLinks} ${isMenuOpen ? landingStyles.navLinksOpen : ""}`}>
            <Link href="/landing#features" className={landingStyles.navLink} ref={(el) => (navLinksRef.current[0] = el)}>
              <span className={landingStyles.navText}>Features</span>
              <div className={landingStyles.navUnderline}></div>
            </Link>
            <Link href="/landing#pricing" className={landingStyles.navLink} ref={(el) => (navLinksRef.current[1] = el)}>
              <span className={landingStyles.navText}>Pricing</span>
              <div className={landingStyles.navUnderline}></div>
            </Link>
            <Link href="/community" className={landingStyles.navLink} ref={(el) => (navLinksRef.current[2] = el)}>
              <span className={landingStyles.navText}>Community</span>
              <div className={landingStyles.navUnderline}></div>
            </Link>
            {user ? (
              <div className={landingStyles.profileContainer}>
                <button className={landingStyles.profileButton} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                  <div className={landingStyles.profileAvatar}>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</div>
                  <span className={landingStyles.profileName}>{user.name}</span>
                  <svg className={landingStyles.dropdownArrow} width="12" height="8" viewBox="0 0 12 8">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </button>
                {showProfileDropdown && (
                  <div className={landingStyles.profileDropdown}>
                    <Link href="/profile" className={landingStyles.dropdownItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      Profile Settings
                    </Link>
                    <Link href="/editor" className={landingStyles.dropdownItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" />
                        <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" />
                        <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      Editor
                    </Link>
                    <button
                      className={landingStyles.dropdownItem}
                      onClick={() => {
                        logout();
                        setShowProfileDropdown(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" />
                        <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" />
                        <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
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

          <button className={landingStyles.menuToggle} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            <span className={landingStyles.hamburgerLine}></span>
            <span className={landingStyles.hamburgerLine}></span>
            <span className={landingStyles.hamburgerLine}></span>
          </button>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroGlow}></div>
        <div className={styles.heroContainer}>
          <h1 className={styles.heroTitle}>Brew3D Community</h1>
          <p className={styles.heroSubtitle}>Build together. Learn together. Ship together.</p>
          <div className={styles.heroActions}>
            <Link href="#pillars" className={styles.primaryButton}>Explore Pillars</Link>
            <Link href="/editor" className={styles.secondaryButton}>Jump into Editor</Link>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}><span className={styles.statNumber}>50K+</span><span className={styles.statLabel}>Community Members</span></div>
            <div className={styles.stat}><span className={styles.statNumber}>1200+</span><span className={styles.statLabel}>Shared Designs</span></div>
            <div className={styles.stat}><span className={styles.statNumber}>300+</span><span className={styles.statLabel}>Tutorials</span></div>
          </div>
        </div>
        <div className={styles.floatingOrbs}>
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </section>

      <section id="pillars" className={styles.pillarsIntro}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Core Pillars</h2>
          <p className={styles.sectionSubtitle}>The engine that powers the Brew3D creator ecosystem</p>
        </div>
      </section>

      <section className={styles.fullColumn}>
        {pillars.map((pillar) => (
          <section key={pillar.id} className={styles.pillarFullSection}>
            <div className={styles.wideContainer}>
              <div className={styles.pillarHeaderRow}>
                <div>
                  <h3 className={styles.pillarBoxTitle}>{pillar.title}</h3>
                  <p className={styles.pillarBoxDesc}>{pillar.description}</p>
                </div>
                <Link href={`/community/${pillar.id}`} className={styles.viewButton}>View →</Link>
              </div>
              <div className={styles.twoByTwo}>
                {pillar.cards.slice(0, 4).map((card) => (
                  <Link key={card.slug} href={`/community/${pillar.id}/${card.slug}`} className={styles.card}>
                    <div className={styles.cardGlow}></div>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardIcon}></div>
                      <h4>{card.title}</h4>
                    </div>
                    <p className={styles.cardDesc}>{card.blurb}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <h3>Ready to build the future together?</h3>
            <p>Join the community and start creating in minutes.</p>
            <div className={styles.ctaActions}>
              <Link href="/auth/signup" className={styles.primaryButton}>Join the Community</Link>
              <Link href="/landing#community" className={styles.secondaryButton}>See What’s Trending</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className={landingStyles.footer}>
        <div className={landingStyles.container}>
          <div className={landingStyles.footerContent}>
            <div className={landingStyles.footerBrand}>
              <div className={landingStyles.logo}>
                <img src="/brew3d-logo.png" alt="Brew3D" className={landingStyles.logoImage} />
                <span className={landingStyles.logoText}>Brew3D</span>
              </div>
              <p className={landingStyles.footerDescription}>The future of AI-powered 3D creation</p>
            </div>
            <div className={landingStyles.footerLinks}>
              <div className={landingStyles.footerColumn}>
                <h4>Product</h4>
                <Link href="/landing#features">Features</Link>
                <Link href="/landing#pricing">Pricing</Link>
                <Link href="/editor">Editor</Link>
              </div>
              <div className={landingStyles.footerColumn}>
                <h4>Community</h4>
                <Link href="/community">Discord</Link>
                <Link href="/community">Tutorials</Link>
                <Link href="/community">Templates</Link>
              </div>
              <div className={landingStyles.footerColumn}>
                <h4>Support</h4>
                <Link href="#help">Help Center</Link>
                <Link href="#contact">Contact</Link>
                <Link href="#status">Status</Link>
              </div>
            </div>
          </div>
          <div className={landingStyles.footerBottom}>
            <p>© 2025 Brew3D. All rights reserved.</p>
            <div className={landingStyles.footerLegal}>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Card({ title, desc }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardGlow}></div>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}></div>
        <h4>{title}</h4>
      </div>
      <p className={styles.cardDesc}>{desc}</p>
    </div>
  );
}

// PillarBox removed in favor of full-width stacked sections per user request


