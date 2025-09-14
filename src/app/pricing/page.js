"use client";

import React from "react";
import Link from "next/link";
import styles from "./pricing.module.css";

export default function PricingPage() {
  return (
    <div className={styles.pricing}>
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
            <Link href="/contact" className={styles.navLink}>Contact</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Choose Your
              <span className={styles.gradientText}> Creative Plan</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Start creating amazing 3D models today. Upgrade anytime as your needs grow.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className={styles.pricingSection}>
        <div className={styles.container}>
          <div className={styles.pricingGrid}>
            {/* Free Plan */}
            <div className={styles.pricingCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.planName}>Free</h3>
                <div className={styles.price}>
                  <span className={styles.currency}>$</span>
                  <span className={styles.amount}>0</span>
                  <span className={styles.period}>/month</span>
                </div>
                <p className={styles.planDescription}>
                  Perfect for getting started with 3D modeling
                </p>
              </div>
              <div className={styles.features}>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>5 projects per month</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Basic AI prompts</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Standard export formats</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Community support</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Basic edge manipulation</span>
                </div>
              </div>
              <Link href="/editor" className={styles.planButton}>
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className={`${styles.pricingCard} ${styles.popular}`}>
              <div className={styles.popularBadge}>Most Popular</div>
              <div className={styles.cardHeader}>
                <h3 className={styles.planName}>Pro</h3>
                <div className={styles.price}>
                  <span className={styles.currency}>$</span>
                  <span className={styles.amount}>20</span>
                  <span className={styles.period}>/month</span>
                </div>
                <p className={styles.planDescription}>
                  For serious creators and professionals
                </p>
              </div>
              <div className={styles.features}>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Unlimited projects</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Advanced AI prompts</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>All export formats</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Priority support</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Advanced edge manipulation</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Cloud storage (10GB)</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Collaboration tools</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Custom materials library</span>
                </div>
              </div>
              <Link href="/editor" className={`${styles.planButton} ${styles.primaryButton}`}>
                Start Pro Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className={styles.pricingCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.planName}>Enterprise</h3>
                <div className={styles.price}>
                  <span className={styles.currency}>$</span>
                  <span className={styles.amount}>Custom</span>
                </div>
                <p className={styles.planDescription}>
                  Tailored solutions for large teams and organizations
                </p>
              </div>
              <div className={styles.features}>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Everything in Pro</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Unlimited cloud storage</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Dedicated support</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Custom integrations</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>Team management</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>API access</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>On-premise deployment</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  <span>SLA guarantee</span>
                </div>
              </div>
              <Link href="/contact" className={styles.planButton}>
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Can I change plans anytime?</h3>
              <p className={styles.faqAnswer}>
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any billing differences.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>What payment methods do you accept?</h3>
              <p className={styles.faqAnswer}>
                We accept all major credit cards, PayPal, and for Enterprise plans, we also accept 
                bank transfers and purchase orders.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Is there a free trial for Pro?</h3>
              <p className={styles.faqAnswer}>
                Yes! You can try Pro features free for 14 days. No credit card required to start your trial.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Can I cancel anytime?</h3>
              <p className={styles.faqAnswer}>
                Absolutely. You can cancel your subscription at any time. You'll continue to have access 
                to paid features until the end of your billing period.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Do you offer educational discounts?</h3>
              <p className={styles.faqAnswer}>
                Yes! Students and educators get 50% off Pro plans. Contact us with your educational 
                email address to get started.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>What export formats are supported?</h3>
              <p className={styles.faqAnswer}>
                We support OBJ, FBX, STL, GLTF, and custom JSON formats. Pro users get access to 
                additional formats and higher resolution exports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Start Creating?</h2>
            <p className={styles.ctaSubtitle}>
              Join thousands of creators who are already using Simo to bring their ideas to life.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/editor" className={styles.ctaButton}>
                Start Free Trial
              </Link>
              <Link href="/contact" className={styles.secondaryButton}>
                Talk to Sales
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
              © 2024 Simo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
