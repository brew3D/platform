"use client";

import Link from "next/link";
import styles from "../landing/landing.module.css";

export default function PricingPage() {
  return (
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
  );
}
