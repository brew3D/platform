"use client";

import React from "react";
import Link from "next/link";
import styles from "./landing.module.css";

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🎨</span>
            <span className={styles.logoText}>Simo</span>
          </div>
          <div className={styles.navLinks}>
            <Link href="/landing" className={styles.navLink}>Home</Link>
            <Link href="/editor" className={styles.navLink}>Try It Out</Link>
            <Link href="/pricing" className={styles.navLink}>Pricing</Link>
            <Link href="/about" className={styles.navLink}>About</Link>
            <Link href="/blog" className={styles.navLink}>Blog</Link>
            <Link href="/help" className={styles.navLink}>Help</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              The AI-Powered
              <span className={styles.gradientText}> 3D Modeling</span>
              <br />
              Revolution
            </h1>
            <p className={styles.heroSubtitle}>
              Create stunning 3D models with the power of AI. Simo brings the complexity 
              of Blender to everyone through intelligent, natural language commands.
            </p>
            <div className={styles.heroButtons}>
              <Link href="/editor" className={styles.primaryButton}>
                Try It Out Free
                <span className={styles.buttonIcon}>→</span>
              </Link>
              <button className={styles.secondaryButton}>
                Watch Demo
                <span className={styles.buttonIcon}>▶</span>
              </button>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.visualContainer}>
              <div className={styles.cube3d}>
                <div className={styles.cubeFace}></div>
                <div className={styles.cubeFace}></div>
                <div className={styles.cubeFace}></div>
                <div className={styles.cubeFace}></div>
                <div className={styles.cubeFace}></div>
                <div className={styles.cubeFace}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Why Choose Simo?</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🤖</div>
              <h3 className={styles.featureTitle}>AI-Powered</h3>
              <p className={styles.featureDescription}>
                Simply describe what you want to create in natural language, 
                and our AI will generate the 3D model for you.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⚡</div>
              <h3 className={styles.featureTitle}>Lightning Fast</h3>
              <p className={styles.featureDescription}>
                Create complex 3D scenes in minutes, not hours. 
                No need to learn complex software interfaces.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎯</div>
              <h3 className={styles.featureTitle}>Precise Control</h3>
              <p className={styles.featureDescription}>
                Fine-tune your models with intuitive edge dragging and 
                real-time manipulation tools.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🌐</div>
              <h3 className={styles.featureTitle}>Web-Based</h3>
              <p className={styles.featureDescription}>
                No downloads or installations required. 
                Access your 3D modeling tools from any device.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎨</div>
              <h3 className={styles.featureTitle}>Professional Quality</h3>
              <p className={styles.featureDescription}>
                Export your models in standard formats for use in 
                Blender, Maya, or any 3D software.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💡</div>
              <h3 className={styles.featureTitle}>Beginner Friendly</h3>
              <p className={styles.featureDescription}>
                Perfect for beginners who want to create 3D content 
                without the steep learning curve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Create?</h2>
            <p className={styles.ctaSubtitle}>
              Join thousands of creators who are already using Simo to bring their ideas to life.
            </p>
            <Link href="/editor" className={styles.ctaButton}>
              Start Creating Now
              <span className={styles.buttonIcon}>🚀</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}>
                <span className={styles.logoIcon}>🎨</span>
                <span className={styles.logoText}>Simo</span>
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
                <Link href="#features" className={styles.footerLink}>Features</Link>
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
              © 2024 Simo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
