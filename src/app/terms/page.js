'use client';

import { useEffect } from 'react';
import styles from './terms.module.css';

export default function TermsPage() {
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
              <a href="/" className={styles.logoLink}>
                <span className={styles.logoText}>PiWea</span>
              </a>
            </div>
            <nav className={styles.nav}>
              <a href="/landing" className={styles.navLink}>Home</a>
              <a href="/landing#features" className={styles.navLink}>Features</a>
              <a href="/pricing" className={styles.navLink}>Pricing</a>
              <a href="/community" className={styles.navLink}>Community</a>
              <a href="/editor" className={styles.navButton}>Start Creating</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Terms of Service</h1>
          <p className={styles.heroSubtitle}>
            Please read these terms carefully before using our AI-powered 3D creation platform.
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
            <h2 className={styles.sectionTitle}>Acceptance of Terms</h2>
            <div className={styles.sectionContent}>
              <p>By accessing and using PiWea's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
              <p>These terms apply to all visitors, users, and others who access or use our service.</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Description of Service</h2>
            <div className={styles.sectionContent}>
              <p>PiWea provides a cloud-based, AI-powered 3D modeling and collaboration platform that includes:</p>
              <ul>
                <li>Real-time collaborative 3D modeling tools</li>
                <li>AI-assisted design and modeling features</li>
                <li>Cloud storage and project management</li>
                <li>Team collaboration and sharing capabilities</li>
                <li>Export and integration with other 3D software</li>
                <li>Educational resources and tutorials</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>User Accounts</h2>
            <div className={styles.sectionContent}>
              <h3>Account Creation</h3>
              <p>To access certain features of our service, you must create an account. You agree to:</p>
              <ul>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
              
              <h3>Account Termination</h3>
              <p>We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason at our sole discretion.</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Acceptable Use</h2>
            <div className={styles.sectionContent}>
              <p>You agree to use our service only for lawful purposes and in accordance with these terms. You agree NOT to:</p>
              <ul>
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Transmit any malicious code or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service</li>
                <li>Create content that is defamatory, offensive, or inappropriate</li>
                <li>Infringe on intellectual property rights</li>
                <li>Use the service to compete with PiWea</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Intellectual Property</h2>
            <div className={styles.sectionContent}>
              <h3>Your Content</h3>
              <p>You retain ownership of all content you create using our service. By using our service, you grant us a limited, non-exclusive license to:</p>
              <ul>
                <li>Store and process your content to provide the service</li>
                <li>Display your content to other users when you choose to share</li>
                <li>Create backups and ensure data security</li>
                <li>Improve our AI models using anonymized data</li>
              </ul>
              
              <h3>Our Content</h3>
              <p>All rights, title, and interest in our service, including software, algorithms, and documentation, remain our property. You may not copy, modify, or distribute our proprietary technology.</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Privacy and Data</h2>
            <div className={styles.sectionContent}>
              <p>Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these terms by reference.</p>
              <p>We implement industry-standard security measures to protect your data, but no system is completely secure. You use our service at your own risk.</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Payment and Billing</h2>
            <div className={styles.sectionContent}>
              <h3>Subscription Plans</h3>
              <p>We offer various subscription plans with different features and usage limits. Pricing and features are subject to change with notice.</p>
              
              <h3>Billing</h3>
              <p>Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law.</p>
              
              <h3>Cancellation</h3>
              <p>You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period. No refunds are provided for partial periods.</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Service Availability</h2>
            <div className={styles.sectionContent}>
              <p>We strive to maintain high service availability, but we do not guarantee uninterrupted access. We may:</p>
              <ul>
                <li>Perform scheduled maintenance</li>
                <li>Update or modify the service</li>
                <li>Suspend service for security reasons</li>
                <li>Experience outages due to factors beyond our control</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Limitation of Liability</h2>
            <div className={styles.sectionContent}>
              <p>To the maximum extent permitted by law, PiWea shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising from your use of our service.</p>
              <p>Our total liability to you for any claims arising from these terms or your use of our service shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Indemnification</h2>
            <div className={styles.sectionContent}>
              <p>You agree to indemnify and hold harmless PiWea, its officers, directors, employees, and agents from any claims, damages, or expenses arising from:</p>
              <ul>
                <li>Your use of our service</li>
                <li>Your violation of these terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Content you create or share through our service</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Governing Law</h2>
            <div className={styles.sectionContent}>
              <p>These terms shall be governed by and construed in accordance with the laws of the State of California, without regard to conflict of law principles.</p>
              <p>Any disputes arising from these terms or your use of our service shall be resolved in the state or federal courts located in San Francisco, California.</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Changes to Terms</h2>
            <div className={styles.sectionContent}>
              <p>We reserve the right to modify these terms at any time. We will notify users of material changes by email or through our service. Your continued use of our service after changes become effective constitutes acceptance of the new terms.</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Contact Information</h2>
            <div className={styles.sectionContent}>
              <p>If you have any questions about these terms, please contact us at:</p>
              <div className={styles.contactInfo}>
                <p><strong>Email:</strong> legal@ruchi-ai.com</p>
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
                <span className={styles.logoText}>PiWea</span>
              </div>
              <p className={styles.footerDescription}>
                The future of AI-powered 3D creation
              </p>
            </div>
            
            <div className={styles.footerLinks}>
              <div className={styles.footerColumn}>
                <h4>Product</h4>
                <a href="/landing#features">Features</a>
                <a href="/pricing">Pricing</a>
                <a href="/editor">Editor</a>
              </div>
              
              <div className={styles.footerColumn}>
                <h4>Community</h4>
                <a href="/community">Discord</a>
                <a href="/community">Tutorials</a>
                <a href="/community">Templates</a>
              </div>
              
              <div className={styles.footerColumn}>
                <h4>Support</h4>
                <a href="/landing#help">Help Center</a>
                <a href="/landing#contact">Contact</a>
                <a href="/landing#status">Status</a>
              </div>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <p>&copy; 2025 PiWea. All rights reserved.</p>
            <div className={styles.footerLegal}>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
