"use client";

import React from "react";
import Link from "next/link";
import styles from "./about.module.css";

export default function AboutPage() {
  return (
    <div className={styles.about}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <div className={styles.logo}>
            <img src="/brew3d-logo.png" alt="Brew3D" className={styles.logoImage} />
            <span className={styles.logoText}>Brew3D</span>
          </div>
          <div className={styles.navLinks}>
            <Link href="/landing" className={styles.navLink}>Home</Link>
            <Link href="/editor" className={styles.navLink}>Try It Out</Link>
            <Link href="/pricing" className={styles.navLink}>Pricing</Link>
            <Link href="/about" className={styles.navLink}>About</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              About
              <span className={styles.gradientText}> Brew3D</span>
            </h1>
            <p className={styles.heroSubtitle}>
              We&apos;re revolutionizing 3D modeling by making it accessible to everyone through the power of AI.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className={styles.missionSection}>
        <div className={styles.container}>
          <div className={styles.missionGrid}>
            <div className={styles.missionContent}>
              <h2 className={styles.sectionTitle}>Our Mission</h2>
              <p className={styles.missionText}>
                At Brew3D, we believe that 3D modeling shouldn&apos;t be limited to professionals with years of training. 
                Our mission is to democratize 3D creation by combining cutting-edge AI technology with intuitive 
                design tools that anyone can use.
              </p>
              <p className={styles.missionText}>
                We&apos;re building the future where ideas can be transformed into 3D reality in minutes, not months. 
                Whether you&apos;re a designer, educator, entrepreneur, or just someone with a creative vision, 
                Brew3D empowers you to bring your ideas to life.
              </p>
            </div>
            <div className={styles.missionVisual}>
              <div className={styles.visualContainer}>
                <div className={styles.floatingElement}>🎨</div>
                <div className={styles.floatingElement}>🤖</div>
                <div className={styles.floatingElement}>⚡</div>
                <div className={styles.floatingElement}>🚀</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className={styles.storySection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Our Story</h2>
          <div className={styles.storyContent}>
            <div className={styles.storyTimeline}>
              <div className={styles.timelineItem}>
                <div className={styles.timelineYear}>2022</div>
                <div className={styles.timelineContent}>
                  <h3 className={styles.timelineTitle}>The Beginning</h3>
                  <p className={styles.timelineText}>
                    Founded by a team of AI researchers and 3D modeling experts who saw the potential 
                    to revolutionize creative workflows through artificial intelligence.
                  </p>
                </div>
              </div>
              
              <div className={styles.timelineItem}>
                <div className={styles.timelineYear}>2023</div>
                <div className={styles.timelineContent}>
                  <h3 className={styles.timelineTitle}>First Breakthrough</h3>
                  <p className={styles.timelineText}>
                    Developed our core AI engine that can understand natural language descriptions 
                    and generate accurate 3D models. Raised $5M in seed funding.
                  </p>
                </div>
              </div>
              
              <div className={styles.timelineItem}>
                <div className={styles.timelineYear}>2024</div>
                <div className={styles.timelineContent}>
                  <h3 className={styles.timelineTitle}>Public Launch</h3>
                  <p className={styles.timelineText}>
                    Launched Brew3D to the public with advanced edge manipulation tools and 
                    real-time collaboration features. Over 10,000 creators joined in the first month.
                  </p>
                </div>
              </div>
              
              <div className={styles.timelineItem}>
                <div className={styles.timelineYear}>Future</div>
                <div className={styles.timelineContent}>
                  <h3 className={styles.timelineTitle}>What&apos;s Next</h3>
                  <p className={styles.timelineText}>
                    Expanding into VR/AR integration, advanced physics simulation, and 
                    enterprise solutions for large-scale 3D content creation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={styles.teamSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Meet Our Team</h2>
          <div className={styles.teamGrid}>
            <div className={styles.teamMember}>
              <div className={styles.memberAvatar}>👨‍💻</div>
              <h3 className={styles.memberName}>Alex Chen</h3>
              <p className={styles.memberRole}>CEO & Co-Founder</p>
              <p className={styles.memberBio}>
                Former Google AI researcher with 10+ years in machine learning. 
                Passionate about making technology accessible to everyone.
              </p>
            </div>
            
            <div className={styles.teamMember}>
              <div className={styles.memberAvatar}>👩‍🎨</div>
              <h3 className={styles.memberName}>Sarah Johnson</h3>
              <p className={styles.memberRole}>CTO & Co-Founder</p>
              <p className={styles.memberBio}>
                3D graphics expert and former Pixar engineer. Led the development 
                of our core rendering and modeling algorithms.
              </p>
            </div>
            
            <div className={styles.teamMember}>
              <div className={styles.memberAvatar}>👨‍🔬</div>
              <h3 className={styles.memberName}>Dr. Michael Rodriguez</h3>
              <p className={styles.memberRole}>Head of AI Research</p>
              <p className={styles.memberBio}>
                PhD in Computer Vision from MIT. Specializes in natural language 
                processing and 3D model generation from text descriptions.
              </p>
            </div>
            
            <div className={styles.teamMember}>
              <div className={styles.memberAvatar}>👩‍💼</div>
              <h3 className={styles.memberName}>Emily Watson</h3>
              <p className={styles.memberRole}>Head of Product</p>
              <p className={styles.memberBio}>
                Former product manager at Adobe. Focuses on user experience and 
                making complex 3D tools intuitive for beginners.
              </p>
            </div>
            
            <div className={styles.teamMember}>
              <div className={styles.memberAvatar}>👨‍🎓</div>
              <h3 className={styles.memberName}>David Kim</h3>
              <p className={styles.memberRole}>Lead Engineer</p>
              <p className={styles.memberBio}>
                Full-stack developer with expertise in real-time 3D applications. 
                Built our web-based 3D engine from the ground up.
              </p>
            </div>
            
            <div className={styles.teamMember}>
              <div className={styles.memberAvatar}>👩‍🎨</div>
              <h3 className={styles.memberName}>Lisa Park</h3>
              <p className={styles.memberRole}>Design Lead</p>
              <p className={styles.memberBio}>
                Award-winning UI/UX designer who creates beautiful, functional 
                interfaces that make complex 3D tools feel simple and intuitive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={styles.valuesSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Our Values</h2>
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🌍</div>
              <h3 className={styles.valueTitle}>Accessibility</h3>
              <p className={styles.valueDescription}>
                We believe 3D creation should be accessible to everyone, regardless of 
                technical background or experience level.
              </p>
            </div>
            
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🚀</div>
              <h3 className={styles.valueTitle}>Innovation</h3>
              <p className={styles.valueDescription}>
                We constantly push the boundaries of what&apos;s possible with AI and 
                3D technology to create better tools for creators.
              </p>
            </div>
            
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🤝</div>
              <h3 className={styles.valueTitle}>Collaboration</h3>
              <p className={styles.valueDescription}>
                We believe the best creations come from working together, which is why 
                we&apos;ve built collaboration into every aspect of our platform.
              </p>
            </div>
            
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>💡</div>
              <h3 className={styles.valueTitle}>Creativity</h3>
              <p className={styles.valueDescription}>
                We empower creators to focus on their ideas rather than technical 
                barriers, unleashing unlimited creative potential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Join Our Mission</h2>
            <p className={styles.ctaSubtitle}>
              Be part of the future of 3D creation. Start building amazing things today.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/editor" className={styles.ctaButton}>
                Start Creating
              </Link>
              <Link href="/contact" className={styles.secondaryButton}>
                Get in Touch
              </Link>
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
                The future of 3D modeling is here. Create, iterate, and share your ideas with AI.
              </p>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerColumn}>
                <h4 className={styles.footerTitle}>Product</h4>
                <Link href="/editor" className={styles.footerLink}>Try It Out</Link>
                <Link href="/pricing" className={styles.footerLink}>Pricing</Link>
                <Link href="/features" className={styles.footerLink}>Features</Link>
              </div>
              <div className={styles.footerColumn}>
                <h4 className={styles.footerTitle}>Company</h4>
                <Link href="/about" className={styles.footerLink}>About</Link>
                <Link href="/contact" className={styles.footerLink}>Contact</Link>
                <Link href="/blog" className={styles.footerLink}>Blog</Link>
              </div>
              <div className={styles.footerColumn}>
                <h4 className={styles.footerTitle}>Support</h4>
                <Link href="/help" className={styles.footerLink}>Help Center</Link>
                <Link href="/docs" className={styles.footerLink}>Documentation</Link>
                <Link href="/community" className={styles.footerLink}>Community</Link>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p className={styles.footerCopyright}>
              © 2024 Brew3D. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
