"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./contact.module.css";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
    plan: 'free'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We\'ll get back to you within 24 hours.');
    setFormData({
      name: '',
      email: '',
      company: '',
      subject: '',
      message: '',
      plan: 'free'
    });
  };

  return (
    <div className={styles.contact}>
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
              Get in
              <span className={styles.gradientText}> Touch</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Have questions? Need support? We&apos;re here to help you succeed with your 3D modeling journey.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.contactSection}>
        <div className={styles.container}>
          <div className={styles.contactGrid}>
            {/* Contact Form */}
            <div className={styles.contactForm}>
              <h2 className={styles.formTitle}>Send us a Message</h2>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.label}>Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={styles.input}
                      required
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="company" className={styles.label}>Company</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="plan" className={styles.label}>Interested Plan</label>
                    <select
                      id="plan"
                      name="plan"
                      value={formData.plan}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro ($20/month)</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="subject" className={styles.label}>Subject *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message" className={styles.label}>Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    rows="6"
                    required
                  />
                </div>

                <button type="submit" className={styles.submitButton}>
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className={styles.contactInfo}>
              <h2 className={styles.infoTitle}>Contact Information</h2>
              
              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>📧</div>
                <div className={styles.infoContent}>
                  <h3 className={styles.infoLabel}>Email</h3>
                  <p className={styles.infoText}>hello@simo.ai</p>
                  <p className={styles.infoText}>support@simo.ai</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>📞</div>
                <div className={styles.infoContent}>
                  <h3 className={styles.infoLabel}>Phone</h3>
                  <p className={styles.infoText}>+1 (555) 123-4567</p>
                  <p className={styles.infoText}>Mon-Fri 9AM-6PM PST</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>📍</div>
                <div className={styles.infoContent}>
                  <h3 className={styles.infoLabel}>Office</h3>
                  <p className={styles.infoText}>123 Innovation Drive</p>
                  <p className={styles.infoText}>San Francisco, CA 94105</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>💬</div>
                <div className={styles.infoContent}>
                  <h3 className={styles.infoLabel}>Live Chat</h3>
                  <p className={styles.infoText}>Available 24/7</p>
                  <p className={styles.infoText}>Average response: 2 minutes</p>
                </div>
              </div>

              <div className={styles.socialLinks}>
                <h3 className={styles.socialTitle}>Follow Us</h3>
                <div className={styles.socialIcons}>
                  <a href="#" className={styles.socialLink}>🐦</a>
                  <a href="#" className={styles.socialLink}>📘</a>
                  <a href="#" className={styles.socialLink}>📷</a>
                  <a href="#" className={styles.socialLink}>💼</a>
                  <a href="#" className={styles.socialLink}>📺</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Common Questions</h2>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>How quickly do you respond?</h3>
              <p className={styles.faqAnswer}>
                We typically respond to all inquiries within 24 hours. For urgent issues, 
                our live chat support is available 24/7 with an average response time of 2 minutes.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Do you offer custom solutions?</h3>
              <p className={styles.faqAnswer}>
                Yes! Our Enterprise plan includes custom integrations, API access, and 
                tailored solutions for large organizations. Contact our sales team to discuss your needs.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Can I schedule a demo?</h3>
              <p className={styles.faqAnswer}>
                Absolutely! We offer personalized demos for Pro and Enterprise customers. 
                Book a demo through our contact form or reach out to our sales team directly.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>What support channels do you offer?</h3>
              <p className={styles.faqAnswer}>
                We provide email support, live chat, phone support for Enterprise customers, 
                and a comprehensive help center with documentation and tutorials.
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
