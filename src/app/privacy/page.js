'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './privacy.module.css';

export default function PrivacyPage() {
  useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.inner}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <Link href="/" className={styles.logoLink}>
                <img src="/brew3d-logo.png" alt="Brew3D" className={styles.logoImage} />
                <span className={styles.logoText}>Brew3D</span>
              </Link>
            </div>
            <nav className={styles.nav}>
              <Link href="/landing" className={styles.navLink}>Home</Link>
              <Link href="/landing#features" className={styles.navLink}>Features</Link>
              <Link href="/pricing" className={styles.navLink}>Pricing</Link>
              <Link href="/community" className={styles.navLink}>Community</Link>
              <Link href="/editor" className={styles.navButton}>Start Creating</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Privacy Policy</h1>
          <p className={styles.heroSubtitle}>
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <div className={styles.lastUpdated}>
            Last updated: January 2025
          </div>
        </div>
      </section>

      {/* Content */}
      <main className={styles.main}>
        <div className={styles.content}>
          
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Information We Collect</h2>
            <div className={styles.sectionContent}>
              <h3>Personal Information</h3>
              <p>We collect information you provide directly to us, such as when you:</p>
              <ul>
                <li>Create an account or profile</li>
                <li>Use our 3D modeling services</li>
                <li>Contact us for support</li>
                <li>Subscribe to our newsletter</li>
              </ul>
              
              <h3>Usage Information</h3>
              <p>We automatically collect certain information about your use of our services, including:</p>
              <ul>
                <li>Device information and IP address</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent on our platform</li>
                <li>3D models and projects you create</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>How We Use Your Information</h2>
            <div className={styles.sectionContent}>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Develop new products and features</li>
                <li>Monitor and analyze usage patterns</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Information Sharing</h2>
            <div className={styles.sectionContent}>
              <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except:</p>
              <ul>
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>In connection with a business transfer or merger</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Data Security</h2>
            <div className={styles.sectionContent}>
              <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:</p>
              <ul>
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure cloud infrastructure</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Your Rights</h2>
            <div className={styles.sectionContent}>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Opt out of marketing communications</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Cookies and Tracking</h2>
            <div className={styles.sectionContent}>
              <p>We use cookies and similar technologies to enhance your experience, including:</p>
              <ul>
                <li>Essential cookies for functionality</li>
                <li>Analytics cookies to understand usage</li>
                <li>Preference cookies to remember settings</li>
                <li>Marketing cookies (with your consent)</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Children&apos;s Privacy</h2>
            <div className={styles.sectionContent}>
              <p>Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Changes to This Policy</h2>
            <div className={styles.sectionContent}>
              <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Your continued use of our services after any changes constitutes acceptance of the updated policy.</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Contact Us</h2>
            <div className={styles.sectionContent}>
              <p>If you have any questions about this privacy policy or our data practices, please contact us at:</p>
              <div className={styles.contactInfo}>
                <p><strong>Email:</strong> privacy@brew3d.com</p>
                <p><strong>Address:</strong> 123 Innovation Drive, Tech City, TC 12345</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.inner}>
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
                <Link href="/landing#features">Features</Link>
                <Link href="/pricing">Pricing</Link>
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
                <Link href="/landing#help">Help Center</Link>
                <Link href="/landing#contact">Contact</Link>
                <Link href="/landing#status">Status</Link>
              </div>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <p>&copy; 2025 Brew3D. All rights reserved.</p>
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
