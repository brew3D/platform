"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense, forwardRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
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
  
  // Demo playground state
  const [demoObjects, setDemoObjects] = useState([]); // {id, type, pos}
  const addPrimitive = (type) => {
    const id = `${type}_${Date.now()}`;
    setDemoObjects(prev => [...prev, { id, type, pos: [Math.random()*2-1, 0.5, Math.random()*2-1] }]);
  };
  const clearDemo = () => setDemoObjects([]);

  // Mario demo state
  const [marioAdded, setMarioAdded] = useState(false);
  const [marioHasSound, setMarioHasSound] = useState(false);
  const [marioHasJumped, setMarioHasJumped] = useState(false);
  const marioRef = useRef();
  const audioRef = useRef(null);
  const [showItsThatEasy, setShowItsThatEasy] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const loopRef = useRef(null);
  const [showControls, setShowControls] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showNextOptions, setShowNextOptions] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [stepsComplete, setStepsComplete] = useState(false);
  const showOptionsOnce = () => {
    setShowNextOptions(false);
    // show briefly and then hide to avoid being "stuck"
    setTimeout(() => setShowNextOptions(true), 0);
  };
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: 'Hi, I\'m Pea! Let\'s make Mario jump!' },
    { role: 'user', text: 'MAKE ME A MARIO THAT JUMPS WITH SOUND' },
    { role: 'bot', text: 'Great! Click Start and I’ll guide you step-by-step.' }
  ]);
  const [marioScale, setMarioScale] = useState(0.25);
  const [jumpScale, setJumpScale] = useState(1);
  const [speechText, setSpeechText] = useState('It’s that easy!');
  const [awaitingJumpScale, setAwaitingJumpScale] = useState(false);
  const [awaitingSpeech, setAwaitingSpeech] = useState(false);
  const [jumpScaleInput, setJumpScaleInput] = useState('');
  const [speechInput, setSpeechInput] = useState('');
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [promptValue, setPromptValue] = useState('');
  const [isPromptFocused, setIsPromptFocused] = useState(false);

  // Animated stats state
  const [animatedStats, setAnimatedStats] = useState({
    users: 0,
    scenes: 0,
    uptime: 0
  });

  // Animate stats counters
  useEffect(() => {
    const animateStats = () => {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const stepDuration = duration / steps;
      
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const progress = step / steps;
        
        setAnimatedStats({
          users: Math.floor(10000 * progress),
          scenes: Math.floor(50000 * progress),
          uptime: Math.floor(99.9 * progress * 10) / 10
        });
        
        if (step >= steps) {
          clearInterval(interval);
          setAnimatedStats({
            users: 10000,
            scenes: 50000,
            uptime: 99.9
          });
        }
      }, stepDuration);
    };

    // Start animation when component mounts
    const timer = setTimeout(animateStats, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (marioAdded && marioHasSound && marioHasJumped) {
      setShowItsThatEasy(true);
    }
  }, [marioAdded, marioHasSound, marioHasJumped]);

  // When all steps are complete (including loop), show next options and stop loader
  useEffect(() => {
    const complete = marioAdded && marioHasSound && marioHasJumped && isLooping;
    setStepsComplete(complete);
    if (complete && !showNextOptions) {
      setShowNextOptions(true);
      setChatMessages(prev => ([...prev, { role: 'bot', text: 'How did you like that? Next I can:' }]));
    }
  }, [marioAdded, marioHasSound, marioHasJumped, isLooping]);

  const onAddMario = () => {
    setMarioAdded(true);
  };

  const onAddJumpSound = () => {
    if (!audioRef.current) {
      const src = "/Mario%20Jump%20-%20Gaming%20Sound%20Effect%20(HD).mp3";
      audioRef.current = new Audio(src);
      audioRef.current.volume = 0.6;
    }
    setMarioHasSound(true);
    // Play once on add
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } catch {}
  };

  const onMarioJump = () => {
    if (!marioRef.current) return;
    // simple jump: up then down
    const group = marioRef.current;
    const startY = group.position.y;
    const peak = startY + 1.2 * Math.max(1, Math.min(1000, jumpScale));
    let t = 0;
    const duration = 600; // ms total
    const start = performance.now();
    const step = (now) => {
      t = (now - start) / duration;
      if (t >= 1) t = 1;
      // parabolic ease: up then down
      const y = startY + (4 * (t <= 0.5 ? t : 1 - t)) * (peak - startY);
      group.position.y = y;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        group.position.y = startY;
      }
    };
    requestAnimationFrame(step);

    if (marioHasSound && audioRef.current) {
      try { audioRef.current.currentTime = 0; audioRef.current.play(); } catch {}
    }
    setMarioHasJumped(true);
  };

  const startLoop = () => {
    if (loopRef.current) return;
    // immediately trigger once to feel responsive, then every 3s
    onMarioJump();
    loopRef.current = setInterval(() => {
      onMarioJump();
    }, 2000);
    setIsLooping(true);
  };

  const stopLoop = () => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    setIsLooping(false);
  };

  const MarioModel = useMemo(() => {
    return forwardRef(function MarioModelInner(props, ref) {
      const gltf = useGLTF('/mario.glb');
      const { showBubble } = props;
      return (
        <group ref={ref} position={[0, 0, 0]} scale={[marioScale, marioScale, marioScale]} {...props}>
          <primitive object={gltf.scene} />
          {showBubble && (
            <Html position={[0.3, 1.6, 0]} distanceFactor={6} transform>
              <div className={styles.speechBubble}>{speechText}</div>
            </Html>
          )}
        </group>
      );
    });
  }, [marioScale, speechText]);
  
  useGLTF.preload('/mario.glb');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, []);
  
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

  // PromptHero and Playground refs
  const promptHeroRef = useRef(null);
  const playgroundRef = useRef(null);
  const promptInputRef = useRef(null);

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

    // PromptHero to Playground transition
    if (promptHeroRef.current && playgroundRef.current) {
      // PromptHero fade out animation
      ScrollTrigger.create({
        trigger: playgroundRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.to(promptHeroRef.current, {
            opacity: 0.3,
            scale: 0.95,
            duration: 1,
            ease: "power2.out"
          });
        },
        onLeaveBack: () => {
          gsap.to(promptHeroRef.current, {
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "power2.out"
          });
        }
      });

      // Playground entrance animation
      ScrollTrigger.create({
        trigger: playgroundRef.current,
        start: "top 70%",
        onEnter: () => {
          gsap.fromTo(playgroundRef.current, 
            { opacity: 0, y: 100 },
            { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
          );
        }
      });

      // Prompt input animation on scroll
      ScrollTrigger.create({
        trigger: playgroundRef.current,
        start: "top 90%",
        onEnter: () => {
          gsap.to(promptInputRef.current, {
            y: -20,
            scale: 0.95,
            duration: 0.8,
            ease: "power2.out"
          });
        },
        onLeaveBack: () => {
          gsap.to(promptInputRef.current, {
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power2.out"
          });
        }
      });
    }

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
            <img src="/brew3d-logo.png" alt="Brew3D" className={styles.logoImage} />
            <span className={styles.logoText}>Brew3D</span>
            <div className={styles.logoAccent}></div>
          </div>
          
          <div className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}>
            {user && (
              <Link 
                href="/dashboard" 
                className={styles.navLink}
                ref={el => navLinksRef.current[0] = el}
              >
                <span className={styles.navText}>Dashboard</span>
                <div className={styles.navUnderline}></div>
              </Link>
            )}
            <Link 
              href="#prompt-hero" 
              className={styles.navLink}
              ref={el => navLinksRef.current[user ? 1 : 0] = el}
            >
              <span className={styles.navText}>Try Demo</span>
              <div className={styles.navUnderline}></div>
            </Link>
            <Link 
              href="/pricing" 
              className={styles.navLink}
              ref={el => navLinksRef.current[user ? 2 : 1] = el}
            >
              <span className={styles.navText}>Pricing</span>
              <div className={styles.navUnderline}></div>
            </Link>
            <Link 
              href="/community" 
              className={styles.navLink}
              ref={el => navLinksRef.current[user ? 3 : 2] = el}
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

      {/* Prompt Hero Section */}
      <section id="prompt-hero" className={styles.promptHero} ref={promptHeroRef}>
        <div className={styles.promptParticles}>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
        </div>

        <div className={styles.fiberBackground} aria-hidden="true">
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
          <span className={`${styles.fiber}`}></span>
        </div>
        
        <div className={styles.promptContainer}>
          <div className={styles.promptContent}>
            <h1 className={styles.promptTitle}>
              <span className={styles.gradientText}>Weave</span> something together?
              <p className={styles.promptSubtext}>
                Just ask <span className={styles.gradientText}>Pea</span>
              </p>
            </h1>
            <div className={styles.promptInputContainer}>
              <div className={styles.promptInputInner}>
                <input
                  type="text"
                  placeholder="Weave your imagination into reality"
                  className={`${styles.promptInput} ${isPromptFocused ? styles.promptInputFocused : ''}`}
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  onFocus={() => setIsPromptFocused(true)}
                  onBlur={() => setIsPromptFocused(false)}
                  ref={promptInputRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = document.querySelector('#playground');
                      if (target) target.scrollIntoView({ behavior: 'smooth' });
                      setChatMessages(prev => (promptValue.trim()
                        ? [{ role: 'user', text: promptValue.trim() }, ...prev]
                        : prev));
                    }
                  }}
                />
                <button
                  className={styles.generateButton}
                  aria-label="Generate with Pea"
                  onClick={() => {
                    const target = document.querySelector('#playground');
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                    setChatMessages(prev => (promptValue.trim()
                      ? [{ role: 'user', text: promptValue.trim() }, ...prev]
                      : prev));
                  }}
                >
                  Generate
                </button>
                <div className={styles.promptGlow}></div>
              </div>
            </div>
            <div className={styles.promptButtons}>
              <a href="#playground" className={styles.promptButtonSecondary}>
                See Live Demo
                <span className={styles.buttonIcon}>▶</span>
              </a>
              <a href="#cta" className={styles.promptButtonPrimary}>
                Get Started
                <span className={styles.buttonIcon}>→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Playground (Pea Demo) */}
      <section id="playground" className={styles.playgroundSection} ref={playgroundRef}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Watch Pea Build Instantly</h2>
            <p className={styles.sectionSubtitle}>Add objects and orbit the scene. AI-style snapping hints included.</p>
            <div className={styles.playgroundTooltip}>
              <span className={styles.tooltipIcon}>✨</span>
              <span className={styles.tooltipText}>Try building with AI — no install required.</span>
            </div>
          </div>
          <div className={styles.playground}>
            <div className={styles.playgroundCanvas}>
              <Canvas shadows camera={{ position: [3, 3, 3], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5,5,5]} intensity={0.8} castShadow />
                <gridHelper args={[10, 10, '#3b2f4a', '#1f1530']} />
                <OrbitControls enableDamping />
                {demoObjects.map(obj => (
                  <mesh key={obj.id} position={obj.pos} castShadow receiveShadow>
                    {obj.type === 'cube' && <boxGeometry args={[0.6,0.6,0.6]} />}
                    {obj.type === 'sphere' && <sphereGeometry args={[0.35, 32, 32]} />}
                    {obj.type === 'cylinder' && <cylinderGeometry args={[0.25,0.25,0.6, 32]} />}
                    <meshStandardMaterial color={obj.type === 'cube' ? '#9b59b6' : obj.type === 'sphere' ? '#4ecdc4' : '#ffd93d'} emissiveIntensity={0.2} />
                  </mesh>
                ))}
                {/* Fake AI snap hint */}
                <mesh position={[0,0.01,0]} rotation={[-Math.PI/2,0,0]}>
                  <ringGeometry args={[0.6,0.62, 64]} />
                  <meshBasicMaterial color="#9b59b6" transparent opacity={0.4} />
                </mesh>
                {marioAdded && (
                  <Suspense fallback={null}>
                    <MarioModel ref={marioRef} position={[0, 0, 0]} showBubble={showItsThatEasy} />
                  </Suspense>
                )}
              </Canvas>
            </div>
            <div className={styles.playgroundSidebar}>
              <div className={styles.chatbotPanel}>
                <div className={styles.chatHeader}>
                  <div className={styles.peaAvatar}>
                    <div className={styles.peaIcon}>🤖</div>
                    <div className={styles.peaGlow}></div>
                  </div>
                  <div className={styles.botTitle}>Pea</div>
                </div>
                <div className={styles.chatScroll}>
                  {chatMessages.map((m, idx) => (
                    <div key={idx} className={m.role === 'bot' ? styles.botMessage : styles.userMessage}>
                      <span className={m.role === 'bot' ? styles.botName : styles.userName}>
                        {m.role === 'bot' ? 'Pea' : 'You'}
                      </span>
                      <div className={m.role === 'bot' ? styles.messageBubble : styles.messageBubbleUser}>{m.text}</div>
                    </div>
                  ))}
                  {showNextOptions && (
                    <div className={styles.optionsGroup}>
                      <button className={styles.optionButton} onClick={() => {
                        setChatMessages(prev => ([...prev, { role: 'user', text: 'Make mario double in size' }, { role: 'bot', text: 'Gotcha!' }]));
                        setMarioScale(prev => prev * 2);
                        showOptionsOnce();
                      }}>Make mario double in size</button>
                      <button className={styles.optionButton} onClick={() => {
                        setChatMessages(prev => ([...prev, { role: 'user', text: 'Make the jump higher' }, { role: 'bot', text: 'scale jump by Input' }]));
                        setAwaitingJumpScale(true);
                        setShowNextOptions(false);
                      }}>Make the jump higher</button>
                      <button className={styles.optionButton} onClick={() => {
                        setChatMessages(prev => ([...prev, { role: 'user', text: 'Make him say something else' }]));
                        setAwaitingSpeech(true);
                        setShowNextOptions(false);
                      }}>Make him say something else</button>
                    </div>
                  )}
                  {awaitingJumpScale && (
                    <div className={styles.chatInputRow}>
                      <input type="number" min="1" max="1000" step="0.1" placeholder="Enter jump scale (1 - 1000)" className={styles.chatInput} value={jumpScaleInput} onChange={(e) => setJumpScaleInput(e.target.value)} />
                      <button className={styles.primaryButton} onClick={() => {
                        const val = parseFloat(jumpScaleInput);
                        if (!isNaN(val) && val > 0) {
                          const clamped = Math.max(1, Math.min(1000, val));
                          setJumpScale(clamped);
                          setChatMessages(prev => ([...prev, { role: 'user', text: String(val) }, { role: 'bot', text: `Jump scaled to ${clamped}x` }]));
                          setAwaitingJumpScale(false);
                          setJumpScaleInput('');
                          showOptionsOnce();
                        }
                      }}>Set</button>
                    </div>
                  )}
                  {awaitingSpeech && (
                    <div className={styles.chatInputRow}>
                      <input type="text" placeholder="What should Mario say while jumping?" className={styles.chatInput} value={speechInput} onChange={(e) => setSpeechInput(e.target.value)} />
                      <button className={styles.primaryButton} onClick={() => {
                        const txt = (speechInput || '').trim();
                        if (txt) {
                          setSpeechText(txt);
                          setChatMessages(prev => ([...prev, { role: 'user', text: txt }, { role: 'bot', text: 'Updated speech!' }]));
                          setAwaitingSpeech(false);
                          setSpeechInput('');
                          showOptionsOnce();
                        }
                      }}>Set</button>
                    </div>
                  )}
                </div>
                <div className={styles.chatFooter}>
                  {!hasStarted ? (
                    <button className={styles.primaryButton} onClick={() => { 
                      setIsAIGenerating(true);
                      setTimeout(() => {
                        setShowControls(true); 
                        setHasStarted(true);
                        setIsAIGenerating(false);
                      }, 1500);
                    }}>
                      {isAIGenerating ? (
                        <div className={styles.aiLoading}>
                          <div className={styles.loadingDots}>...</div>
                          <span>AI is generating...</span>
                        </div>
                      ) : 'Start'}
                    </button>
                  ) : !showControls ? (
                    <div className={styles.loaderDots} aria-label="Loading steps">...</div>
                  ) : null}
                  <button 
                    className={styles.infoButton} 
                    aria-label="Asset credits"
                    title="Asset credits"
                    onClick={() => setShowCredits(v => !v)}
                  >
                    i
                  </button>
                  {showCredits && (
                    <div className={styles.creditsTooltip}>
                      <span>&quot;Mario obj&quot; by MatiasH290 is licensed under </span>
                      <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
                      <span>. Source: </span>
                      <a href="https://skfb.ly/6X8o8" target="_blank" rel="noopener noreferrer">skfb.ly/6X8o8</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {showControls && (
            <div className={styles.playgroundFooter}>
              <div className={styles.controlsCard}>
                <div className={styles.controlsHeader}>Steps</div>
                <div className={styles.playgroundControls}>
                  <button className={styles.primaryButton} onClick={onAddMario} disabled={!showControls || marioAdded}>Add Mario</button>
                  <button className={styles.secondaryButton} onClick={onMarioJump} disabled={!marioAdded || marioHasJumped}>Make Mario Jump</button>
                  <button className={styles.secondaryButton} onClick={onAddJumpSound} disabled={!marioHasJumped || marioHasSound}>Add the jump sound</button>
                  <button 
                    className={styles.secondaryButton} 
                    onClick={() => (isLooping ? stopLoop() : startLoop())}
                    disabled={!marioAdded || !marioHasSound || !marioHasJumped}
                  >
                    {isLooping ? 'Stop Loop' : 'Loop and sync'}
                  </button>
                  <button className={styles.textButton} onClick={() => {
                    // stop loop and audio, reset everything
                    stopLoop();
                    if (audioRef.current) { try { audioRef.current.pause(); audioRef.current.currentTime = 0; } catch {} }
                    setMarioAdded(false);
                    setMarioHasSound(false);
                    setMarioHasJumped(false);
                    setShowItsThatEasy(false);
                    setDemoObjects([]);
                  }}>Clear</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section - MIRACULOUS GSAP ANIMATIONS */}
      <section id="features" className={styles.features} ref={featuresRef}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} ref={sectionTitleRef}>
              What Makes <span className={styles.gradientText}>Brew3D</span> Powerful
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
              <h3 className={styles.featureTitle}>Cloud Rendering</h3>
              <p className={styles.featureDescription}>
                Your computer stays fast while GPU-heavy rendering runs in the cloud.
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
              <h3 className={styles.featureTitle}>Real-Time Collaboration</h3>
              <p className={styles.featureDescription}>
                See your team build together live with tiny colored cursors.
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
              <h3 className={styles.featureTitle}>AI-Assisted Editing</h3>
              <p className={styles.featureDescription}>
                Snap, align, generate primitives, and get smart suggestions.
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
              <h3 className={styles.featureTitle}>Cross-Engine Ready</h3>
              <p className={styles.featureDescription}>
                Export to Unreal, Unity, Blender, or your own pipelines.
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
              <h3 className={styles.featureTitle}>Browser-First</h3>
              <p className={styles.featureDescription}>
                No installs. Works anywhere. Pick up where you left off in seconds.
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
              <h3 className={styles.featureTitle}>Versioning & History</h3>
              <p className={styles.featureDescription}>
                Automatic saves with undo/redo across collaborators.
              </p>
              <div className={styles.featureAccent}></div>
            </div>
          </div>
          
          {/* Testimonial Carousel */}
          <div className={styles.testimonialCarousel}>
            <div className={styles.testimonialTrack}>
              <div className={styles.testimonial}>
                <div className={styles.testimonialContent}>
                  <p className={styles.testimonialText}>
                    &quot;Brew3D feels like magic. Our team shipped faster than ever.&quot;
                  </p>
                  <span className={styles.testimonialAuthor}>— Indie Studio Lead</span>
                </div>
              </div>
              <div className={styles.testimonial}>
                <div className={styles.testimonialContent}>
                  <p className={styles.testimonialText}>
                    &quot;Finally, 3D collaboration that actually works.&quot;
                  </p>
                  <span className={styles.testimonialAuthor}>— Creative Director</span>
                </div>
              </div>
              <div className={styles.testimonial}>
                <div className={styles.testimonialContent}>
                  <p className={styles.testimonialText}>
                    &quot;The AI assistance is incredible. It&apos;s like having a senior artist on the team.&quot;
                  </p>
                  <span className={styles.testimonialAuthor}>— 3D Artist</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Solution Section - ENHANCED WITH DESCRIPTIONS */}
      <section className={styles.solutionSection}>
        <div className={styles.container}>
          <div className={styles.solutionIntro}>
            <p className={styles.solutionIntroText}>Every creator hits these roadblocks. We fixed them.</p>
          </div>
          <div className={styles.solutionDivider}>
            <h2 className={styles.solutionDividerTitle}>Built to Solve Real Problems</h2>
            <div className={styles.solutionDividerLine}></div>
          </div>
          
          <div className={styles.solutionBanner}>
            <div className={styles.solutionContent}>
              <div className={styles.solutionIcon}>
                <div className={styles.techIcon}></div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.solutionTitle}>Brew3D Solves All of These</h3>
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
                    <p>Thousands per year for professional tools. Small studios and freelancers can&apos;t afford the high costs, while free alternatives lack professional features.</p>
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
                    <p>Heavy reliance on local GPU/CPU power. Large scenes crash on average machines, and there&apos;s no cloud acceleration for complex operations.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Visual Flow Graphic */}
          <div className={styles.visualFlow}>
            <div className={styles.flowStep}>
              <div className={styles.flowIcon}>💡</div>
              <span className={styles.flowText}>Idea</span>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={styles.flowStep}>
              <div className={styles.flowIcon}>🔨</div>
              <span className={styles.flowText}>Build</span>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={styles.flowStep}>
              <div className={styles.flowIcon}>👥</div>
              <span className={styles.flowText}>Collaborate</span>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={styles.flowStep}>
              <div className={styles.flowIcon}>🚀</div>
              <span className={styles.flowText}>Export</span>
            </div>
          </div>
          
          {/* Vision Quote Block */}
          <div className={styles.visionQuote}>
            <div className={styles.visionContent}>
              <p className={styles.visionText}>
                &quot;We believe creation should feel like flow, not friction.&quot;
              </p>
              <span className={styles.visionAuthor}>— Brew3D Team</span>
            </div>
            <div className={styles.visionGlow}></div>
          </div>
        </div>
      </section>


      {/* CTA Section - Email Signup */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Transform Your 3D Workflow?</h2>
            <p className={styles.ctaSubtitle}>
              Join thousands of creators who&apos;ve already made the switch to collaborative 3D modeling
            </p>
            <div className={styles.emailSignup}>
              <div className={styles.emailInputContainer}>
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className={styles.emailInput}
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                />
                <button 
                  className={styles.emailButton}
                  onClick={() => {
                    if (emailValue.trim()) {
                      setEmailSubmitted(true);
                      setTimeout(() => setEmailSubmitted(false), 3000);
                    }
                  }}
                >
                  {emailSubmitted ? '✓ Joined!' : 'Get Early Access'}
                </button>
              </div>
              {emailSubmitted && (
                <div className={styles.successMessage}>
                  <span className={styles.successText}>You&apos;re in! Check your inbox.</span>
                </div>
              )}
              <p className={styles.emailDisclaimer}>
                Be the first to know when we launch. No spam, ever.
              </p>
              
              {/* Social Growth Nudge */}
              <div className={styles.socialNudge}>
                <p className={styles.nudgeText}>Share Brew3D to move up the waitlist</p>
                <div className={styles.socialIcons}>
                  <a href="#" className={styles.socialIcon} aria-label="Share on LinkedIn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a href="#" className={styles.socialIcon} aria-label="Share on Twitter">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                </div>
              </div>
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
                <img src="/brew3d-logo.png" alt="Brew3D" className={styles.logoImage} />
                <span className={styles.logoText}>Brew3D</span>
              </div>
              <p className={styles.footerDescription}>
                The future of AI-powered 3D creation
              </p>
            </div>
            
            <div className={styles.footerLinks}>
              <div className={styles.footerColumn}>
                <h4>Product</h4>
                <Link href="#features">Features</Link>
                <Link href="/pricing">Pricing</Link>
                <Link href="/editor">Editor</Link>
              </div>
              
              <div className={styles.footerColumn}>
                <h4>Community</h4>
                <Link href="/community">Discord</Link>
                <Link href="https://twitter.com/nuvra" target="_blank" rel="noopener noreferrer">Twitter</Link>
                <Link href="https://youtube.com/nuvra" target="_blank" rel="noopener noreferrer">YouTube</Link>
                <Link href="/blog">Blog</Link>
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
            <p>&copy; 2025 Brew3D Studios. All rights reserved.</p>
            <div className={styles.footerTagline}>
              <span>Made with ❤️ by creators, for creators.</span>
            </div>
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
