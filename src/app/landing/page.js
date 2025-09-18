"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from '../contexts/AuthContext';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./landing.module.css";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}


export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { user, logout } = useAuth();
  
  // Refs for GSAP animations
  const featuresRef = useRef(null);
  const featureCardsRef = useRef([]);
  const sectionTitleRef = useRef(null);
  const sectionSubtitleRef = useRef(null);
  const floatingElementsRef = useRef([]);
  
  // Navbar refs
  const navbarRef = useRef(null);
  const logoRef = useRef(null);
  const navLinksRef = useRef([]);
  const navButtonRef = useRef(null);
  const hamburgerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Navbar scroll effect
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 50);
      
      if (navbarRef.current) {
        gsap.to(navbarRef.current, {
          backgroundColor: scrollY > 50 ? 'rgba(10, 10, 10, 0.95)' : 'rgba(10, 10, 10, 0.8)',
          backdropFilter: scrollY > 50 ? 'blur(20px)' : 'blur(10px)',
          duration: 0.3,
          ease: "power2.out"
        });
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Navbar entrance animation
    const navbarTl = gsap.timeline();
    
    navbarTl
      .fromTo(navbarRef.current, 
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      )
      .fromTo(logoRef.current,
        { x: -50, opacity: 0, scale: 0.8 },
        { x: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" },
        "-=0.5"
      )
      .fromTo(navLinksRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
        "-=0.3"
      )
      .fromTo(navButtonRef.current,
        { scale: 0, opacity: 0, rotation: 180 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)" },
        "-=0.2"
      );

    // Hamburger animation
    if (hamburgerRef.current) {
      const lines = hamburgerRef.current.querySelectorAll('.hamburgerLine');
      
      gsap.set(lines, { transformOrigin: "center" });
      
      const hamburgerTl = gsap.timeline({ paused: true });
      hamburgerTl
        .to(lines[0], { rotation: 45, y: 6, duration: 0.3 })
        .to(lines[1], { opacity: 0, duration: 0.2 }, 0)
        .to(lines[2], { rotation: -45, y: -6, duration: 0.3 }, 0);
      
      // Store timeline for later use
      hamburgerRef.current.animation = hamburgerTl;
    }

    // Create floating elements for the features section
    const floatingElements = [];
    for (let i = 0; i < 20; i++) {
      const element = document.createElement('div');
      element.className = styles.floatingFeatureElement;
      element.style.left = Math.random() * 100 + '%';
      element.style.top = Math.random() * 100 + '%';
      element.style.animationDelay = Math.random() * 5 + 's';
      featuresRef.current?.appendChild(element);
      floatingElements.push(element);
    }
    floatingElementsRef.current = floatingElements;

    // MIRACULOUS Features Section Animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: featuresRef.current,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse"
      }
    });

    // Section header animation
    tl.fromTo(sectionTitleRef.current, 
      { 
        y: 100, 
        opacity: 0, 
        scale: 0.8,
        rotationX: 90
      },
      { 
        y: 0, 
        opacity: 1, 
        scale: 1,
        rotationX: 0,
        duration: 1.5,
        ease: "back.out(1.7)"
      }
    )
    .fromTo(sectionSubtitleRef.current,
      {
        y: 50,
        opacity: 0,
        scale: 0.9
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: "power3.out"
      },
      "-=0.8"
    );

    // Individual feature cards animation
    featureCardsRef.current.forEach((card, index) => {
      if (card) {
        // Initial state
        gsap.set(card, {
          y: 150,
          opacity: 0,
          scale: 0.5,
          rotationY: 45,
          transformOrigin: "center center"
        });

        // Animate in - MUCH FASTER
        tl.to(card, {
          y: 0,
          opacity: 1,
          scale: 1,
          rotationY: 0,
          duration: 0.6,
          ease: "back.out(1.4)",
          delay: index * 0.1
        }, "-=0.3");

        // Hover animations
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -20,
            scale: 1.05,
            rotationY: 5,
            duration: 0.6,
            ease: "power2.out"
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
            rotationY: 0,
            duration: 0.6,
            ease: "power2.out"
          });
        });
      }
    });

    // Floating elements animation
    floatingElements.forEach((element, index) => {
      gsap.set(element, {
        scale: 0,
        opacity: 0,
        rotation: Math.random() * 360
      });

      gsap.to(element, {
        scale: 1,
        opacity: 0.6,
        duration: 2,
        delay: index * 0.1,
        ease: "back.out(1.7)"
      });

      // Continuous floating animation
      gsap.to(element, {
        y: "+=50",
        x: "+=30",
        rotation: "+=180",
        duration: 8 + Math.random() * 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    });

    // Magnetic effect for feature cards
    featureCardsRef.current.forEach(card => {
      if (card) {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          
          gsap.to(card, {
            x: x * 0.1,
            y: y * 0.1,
            duration: 0.3,
            ease: "power2.out"
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.3)"
          });
        });
      }
    });

    // Parallax effect for the entire section
    gsap.to(featuresRef.current, {
      y: -100,
      scrollTrigger: {
        trigger: featuresRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1
      }
    });

    // 3D Canvas Scroll Animations - INCREDIBLE EFFECTS
    const macbookTrigger = document.querySelector('[data-scroll-trigger="macbook"]');
    if (macbookTrigger) {
      // Set initial states
      gsap.set('.canvasContainer', { scale: 0.3, opacity: 0.8 });
      
      // Canvas scaling animation as you scroll
      ScrollTrigger.create({
        trigger: macbookTrigger,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const scale = 0.3 + (progress * 0.7); // Scale from 0.3 to 1.0
          gsap.to('.canvasContainer', {
            scale: scale,
            duration: 0.1,
            ease: "none"
          });
        }
      });
      
      // Canvas entrance animation
      ScrollTrigger.create({
        trigger: macbookTrigger,
        start: "top 80%",
        onEnter: () => {
          gsap.to('.canvasContainer', {
            opacity: 1,
            duration: 1,
            ease: "power2.out"
          });
        }
      });
    }

    // Solution Points Animation
    const solutionPoints = document.querySelectorAll('[data-scroll-trigger^="solution-"]');
    
    if (solutionPoints.length > 0) {
      // Set initial states
      gsap.set(solutionPoints, { 
        opacity: 0, 
        y: 80, 
        scale: 0.8,
        rotationX: 15
      });

      // Create staggered animation
      gsap.to(solutionPoints, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationX: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: '.solutionPoints',
          start: "top 70%",
          end: "bottom 30%",
          toggleActions: "play none none reverse"
        }
      });

      // Add hover animations for each solution point
      solutionPoints.forEach((point) => {
        const icon = point.querySelector('.solutionPointIcon');
        const content = point.querySelector('.solutionPointContent');
        
        if (icon && content) {
          point.addEventListener('mouseenter', () => {
            gsap.to(icon, {
              scale: 1.1,
              rotation: 5,
              duration: 0.3,
              ease: "power2.out"
            });
            
            gsap.to(content, {
              y: -5,
              duration: 0.3,
              ease: "power2.out"
            });
          });

          point.addEventListener('mouseleave', () => {
            gsap.to(icon, {
              scale: 1,
              rotation: 0,
              duration: 0.4,
              ease: "elastic.out(1, 0.3)"
            });
            
            gsap.to(content, {
              y: 0,
              duration: 0.4,
              ease: "elastic.out(1, 0.3)"
            });
          });
        }
      });
    }

    return () => {
      // Cleanup
      window.removeEventListener('scroll', handleScroll);
      floatingElements.forEach(element => {
        element.remove();
      });
    };
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profileContainer')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfileDropdown]);

  // Hamburger toggle function
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    
    if (hamburgerRef.current?.animation) {
      if (isMenuOpen) {
        hamburgerRef.current.animation.reverse();
      } else {
        hamburgerRef.current.animation.play();
      }
    }
  };

  return (
    <div className={styles.landing}>
      {/* Navigation - WORLD'S BEST NAVBAR */}
      <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`} ref={navbarRef}>
        <div className={styles.navContainer}>
          <div className={styles.logo} ref={logoRef}>
            <span className={styles.logoText}>Ruchi AI</span>
            <div className={styles.logoAccent}></div>
          </div>
          
          <div className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}>
            <Link 
              href="#features" 
              className={styles.navLink}
              ref={el => navLinksRef.current[0] = el}
            >
              <span className={styles.navText}>Features</span>
              <div className={styles.navUnderline}></div>
            </Link>
            <Link 
              href="#pricing" 
              className={styles.navLink}
              ref={el => navLinksRef.current[1] = el}
            >
              <span className={styles.navText}>Pricing</span>
              <div className={styles.navUnderline}></div>
            </Link>
            <Link 
              href="/community" 
              className={styles.navLink}
              ref={el => navLinksRef.current[2] = el}
            >
              <span className={styles.navText}>Community</span>
              <div className={styles.navUnderline}></div>
            </Link>
            {user ? (
              <div className={styles.profileContainer}>
                <button 
                  className={styles.profileButton}
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  <div className={styles.profileAvatar}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className={styles.profileName}>{user.name}</span>
                  <svg className={styles.dropdownArrow} width="12" height="8" viewBox="0 0 12 8">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                </button>
                {showProfileDropdown && (
                  <div className={styles.profileDropdown}>
                    <Link href="/profile" className={styles.dropdownItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Profile Settings
                    </Link>
                    <Link href="/editor" className={styles.dropdownItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
                        <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Editor
                    </Link>
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => {
                        logout();
                        setShowProfileDropdown(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/>
                        <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link 
                  href="/auth/signin" 
                  className={styles.navLink}
                >
                  <span className={styles.navText}>Sign In</span>
                  <div className={styles.navUnderline}></div>
                </Link>
                <Link 
                  href="/auth/signup" 
                  className={styles.navButton}
                  ref={navButtonRef}
                >
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
            ref={hamburgerRef}
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        {/* Particle Effects */}
        <div className={styles.particles}>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
        </div>
        
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              The Future of <span className={styles.gradientText}>3D Creation</span>
              <br />
              <span className={styles.aiText}>AI-Powered • Collaborative • Stunning</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Create stunning 3D scenes with real-time collaboration, AI assistance, 
              and zero installation required. Perfect for designers, developers, and creators.
            </p>
            <div className={styles.heroButtons}>
              <Link href="/editor" className={styles.primaryButton}>
                Start Creating Free
                <span className={styles.buttonIcon}>→</span>
              </Link>
              <button className={styles.secondaryButton}>
                Watch Demo
                <span className={styles.buttonIcon}>▶</span>
              </button>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>10K+</span>
                <span className={styles.statLabel}>Active Users</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>50K+</span>
                <span className={styles.statLabel}>Scenes Created</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>99.9%</span>
                <span className={styles.statLabel}>Uptime</span>
              </div>
            </div>
          </div>
          <div className={styles.heroVisual}>
            {/* Floating 3D Models */}
            <div className={styles.floatingModels}>
              <div className={`${styles.model3d} ${styles.cube1}`}>
                <div className={styles.cube3d}>
                  <div className={styles.cubeFace}></div>
                  <div className={styles.cubeFace}></div>
                  <div className={styles.cubeFace}></div>
                  <div className={styles.cubeFace}></div>
                  <div className={styles.cubeFace}></div>
                  <div className={styles.cubeFace}></div>
                </div>
              </div>
              
              <div className={`${styles.model3d} ${styles.sphere1}`}>
                <div className={styles.sphere3d}></div>
              </div>
              
              <div className={`${styles.model3d} ${styles.cylinder1}`}>
                <div className={styles.cylinder3d}></div>
              </div>
              
              <div className={`${styles.model3d} ${styles.torus1}`}>
                <div className={styles.torus3d}></div>
              </div>
              
              <div className={`${styles.model3d} ${styles.pyramid1}`}>
                <div className={styles.pyramid3d}></div>
              </div>
            </div>
            
            {/* Main Editor Preview */}
            <div className={styles.editorPreview}>
              <div className={styles.editorHeader}>
                <div className={styles.editorDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className={styles.editorTitle}>Ruchi AI Editor</span>
                <div className={styles.aiIndicator}>
                  <span className={styles.aiPulse}></span>
                  <span>AI Active</span>
                </div>
              </div>
              <div className={styles.editorContent}>
                <div className={styles.scene3d}>
                  <div className={styles.mainCube}>
                    <div className={styles.cube3d}>
                      <div className={styles.cubeFace}></div>
                      <div className={styles.cubeFace}></div>
                      <div className={styles.cubeFace}></div>
                      <div className={styles.cubeFace}></div>
                      <div className={styles.cubeFace}></div>
                      <div className={styles.cubeFace}></div>
                    </div>
                  </div>
                  <div className={styles.sceneLights}>
                    <div className={styles.light1}></div>
                    <div className={styles.light2}></div>
                    <div className={styles.light3}></div>
                  </div>
                </div>
                <div className={styles.collaborationIndicator}>
                  <div className={styles.userAvatar}></div>
                  <div className={styles.userAvatar}></div>
                  <div className={styles.userAvatar}></div>
                  <div className={styles.liveIndicator}>LIVE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - MIRACULOUS GSAP ANIMATIONS */}
      <section id="features" className={styles.features} ref={featuresRef}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} ref={sectionTitleRef}>
              Why Choose <span className={styles.gradientText}>Ruchi AI</span>?
            </h2>
            <p className={styles.sectionSubtitle} ref={sectionSubtitleRef}>
              Built for the modern creator who values collaboration, efficiency, and innovation
            </p>
          </div>
          
          <div className={styles.featuresGrid}>
            <div 
              className={styles.featureCard}
              ref={el => featureCardsRef.current[0] = el}
            >
              <div className={styles.featureIconContainer}>
                <div className={styles.featureIcon}>
                  <div className={styles.iconShape}></div>
                </div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.featureTitle}>Real-Time Collaboration</h3>
              <p className={styles.featureDescription}>
                Multiple users can edit the same 3D scene simultaneously. 
                See changes instantly, no more file merging headaches.
              </p>
              <div className={styles.featureAccent}></div>
            </div>
            
            <div 
              className={styles.featureCard}
              ref={el => featureCardsRef.current[1] = el}
            >
              <div className={styles.featureIconContainer}>
                <div className={styles.featureIcon}>
                  <div className={styles.iconShape}></div>
                </div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.featureTitle}>AI-Powered Assistance</h3>
              <p className={styles.featureDescription}>
                Smart cursor predicts your next move, auto-aligns objects, 
                and suggests materials. Speed up your workflow by 10x.
              </p>
              <div className={styles.featureAccent}></div>
            </div>
            
            <div 
              className={styles.featureCard}
              ref={el => featureCardsRef.current[2] = el}
            >
              <div className={styles.featureIconContainer}>
                <div className={styles.featureIcon}>
                  <div className={styles.iconShape}></div>
                </div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.featureTitle}>Browser-First</h3>
              <p className={styles.featureDescription}>
                No installation required. Works on any device, any OS. 
                Access your projects from anywhere, anytime.
              </p>
              <div className={styles.featureAccent}></div>
            </div>
            
            <div 
              className={styles.featureCard}
              ref={el => featureCardsRef.current[3] = el}
            >
              <div className={styles.featureIconContainer}>
                <div className={styles.featureIcon}>
                  <div className={styles.iconShape}></div>
                </div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.featureTitle}>Cloud Storage & Versioning</h3>
              <p className={styles.featureDescription}>
                Automatic scene saving, history tracking, and undo/redo 
                across all collaborators. Never lose your work.
              </p>
              <div className={styles.featureAccent}></div>
            </div>
            
            <div 
              className={styles.featureCard}
              ref={el => featureCardsRef.current[4] = el}
            >
              <div className={styles.featureIconContainer}>
                <div className={styles.featureIcon}>
                  <div className={styles.iconShape}></div>
                </div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.featureTitle}>Intuitive Interface</h3>
              <p className={styles.featureDescription}>
                Clean, modern UI inspired by the best design tools. 
                Easy for beginners, powerful for professionals.
              </p>
              <div className={styles.featureAccent}></div>
            </div>
            
            <div 
              className={styles.featureCard}
              ref={el => featureCardsRef.current[5] = el}
            >
              <div className={styles.featureIconContainer}>
                <div className={styles.featureIcon}>
                  <div className={styles.iconShape}></div>
                </div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.featureTitle}>Cloud Rendering</h3>
              <p className={styles.featureDescription}>
                Offload heavy rendering to the cloud. Create complex scenes 
                without worrying about your hardware limitations.
              </p>
              <div className={styles.featureAccent}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - ENHANCED WITH DESCRIPTIONS */}
      <section className={styles.solutionSection}>
        <div className={styles.container}>
          <div className={styles.solutionBanner}>
            <div className={styles.solutionContent}>
              <div className={styles.solutionIcon}>
                <div className={styles.techIcon}></div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.solutionTitle}>Ruchi AI Solves All of These</h3>
              <p className={styles.solutionSubtitle}>Real-time collaboration • AI assistance • Browser-based • Affordable pricing</p>
              
              <div className={styles.solutionPoints}>
                <div className={styles.solutionPoint} data-scroll-trigger="solution-1">
                  <div className={styles.solutionPointIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                  </div>
                  <div className={styles.solutionPointContent}>
                    <h4>Manual File Merging</h4>
                    <p>Teams waste hours manually merging 3D files and dealing with version conflicts. No real-time collaboration means constant file swapping and merge conflicts.</p>
                  </div>
                </div>
                
                <div className={styles.solutionPoint} data-scroll-trigger="solution-2">
                  <div className={styles.solutionPointIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div className={styles.solutionPointContent}>
                    <h4>Steep Learning Curve</h4>
                    <p>Complex interfaces and months of training required. New users are intimidated by cluttered UIs and overwhelming feature sets that take forever to master.</p>
                  </div>
                </div>
                
                <div className={styles.solutionPoint} data-scroll-trigger="solution-3">
                  <div className={styles.solutionPointIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                      <circle cx="6" cy="8" r="1"/>
                      <circle cx="10" cy="8" r="1"/>
                      <circle cx="14" cy="8" r="1"/>
                    </svg>
                  </div>
                  <div className={styles.solutionPointContent}>
                    <h4>Expensive Licensing</h4>
                    <p>Thousands per year for professional tools. Small studios and freelancers can't afford the high costs, while free alternatives lack professional features.</p>
                  </div>
                </div>
                
                <div className={styles.solutionPoint} data-scroll-trigger="solution-4">
                  <div className={styles.solutionPointIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                      <path d="M8 9h8"/>
                      <path d="M8 13h6"/>
                    </svg>
                  </div>
                  <div className={styles.solutionPointContent}>
                    <h4>Hardware Limitations</h4>
                    <p>Heavy reliance on local GPU/CPU power. Large scenes crash on average machines, and there's no cloud acceleration for complex operations.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={styles.pricing}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Simple, Transparent Pricing</h2>
            <p className={styles.sectionSubtitle}>
              Start free, upgrade when you need more power
            </p>
          </div>
          
          <div className={styles.pricingGrid}>
            <div className={styles.pricingCard}>
              <div className={styles.pricingHeader}>
                <h3 className={styles.pricingTitle}>Free</h3>
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
                <h3 className={styles.pricingTitle}>Pro</h3>
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
                Start Pro Trial
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

      {/* CTA Section - Email Signup */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Transform Your 3D Workflow?</h2>
            <p className={styles.ctaSubtitle}>
              Join thousands of creators who've already made the switch to collaborative 3D modeling
            </p>
            <div className={styles.emailSignup}>
              <div className={styles.emailInputContainer}>
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className={styles.emailInput}
                />
                <button className={styles.emailButton}>
                  Join Waitlist
                </button>
              </div>
              <p className={styles.emailDisclaimer}>
                Be the first to know when we launch. No spam, ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}>
                <span className={styles.logoText}>Ruchi AI</span>
              </div>
              <p className={styles.footerDescription}>
                The future of AI-powered 3D creation
              </p>
            </div>
            
            <div className={styles.footerLinks}>
              <div className={styles.footerColumn}>
                <h4>Product</h4>
                <Link href="#features">Features</Link>
                <Link href="#pricing">Pricing</Link>
                <Link href="/editor">Editor</Link>
              </div>
              
              <div className={styles.footerColumn}>
                <h4>Community</h4>
                <Link href="/community">Discord</Link>
                <Link href="/community">Tutorials</Link>
                <Link href="/community">Templates</Link>
              </div>
              
              <div className={styles.footerColumn}>
                <h4>Support</h4>
                <Link href="#help">Help Center</Link>
                <Link href="#contact">Contact</Link>
                <Link href="#status">Status</Link>
              </div>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <p>&copy; 2025 Ruchi AI. All rights reserved.</p>
            <div className={styles.footerLegal}>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
