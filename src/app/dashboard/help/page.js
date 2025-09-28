"use client";

import React, { useState } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopbar from "../../components/DashboardTopbar";
import { useAuth } from "../../contexts/AuthContext";
import Chatbot from "./components/Chatbot";
import styles from "./help.module.css";

export default function HelpPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How do I create a new project?",
      answer: "To create a new project, click on the 'Projects' tab in the sidebar, then click the 'Create New Project' button. Fill in the project details and click 'Create' to get started.",
      category: "Projects"
    },
    {
      id: 2,
      question: "How do I invite team members?",
      answer: "Go to the 'Team' section, select your team, and click 'Add Member'. Enter their email address and assign a role. They'll receive an invitation to join your team.",
      category: "Team"
    },
    {
      id: 3,
      question: "How do I change my billing plan?",
      answer: "Navigate to the 'Billing' section in your profile, select the plan you want, and click 'Change Plan'. You'll be redirected to complete the payment process.",
      category: "Billing"
    },
    {
      id: 4,
      question: "How do I use the 3D scene editor?",
      answer: "Go to your project, click on 'Animated Scenes', then 'Create New Scene' or open an existing one. Use the toolbar to add objects, adjust lighting, and position elements in the 3D viewport.",
      category: "Features"
    },
    {
      id: 5,
      question: "How do I collaborate with others?",
      answer: "Use the 'Team' section to add members to your project. You can also use the 'Chat' feature to communicate with team members in real-time.",
      category: "Collaboration"
    },
    {
      id: 6,
      question: "How do I export my project?",
      answer: "In your project dashboard, click on the 'Export' button. Choose your preferred format (GLB, OBJ, or FBX) and download your project files.",
      category: "Export"
    },
    {
      id: 7,
      question: "How do I reset my password?",
      answer: "Go to the sign-in page and click 'Forgot Password'. Enter your email address and follow the instructions sent to your email to reset your password.",
      category: "Account"
    },
    {
      id: 8,
      question: "How do I customize my profile?",
      answer: "Click on your name in the top-right corner, select 'Profile Settings', and update your information. You can change your avatar, bio, and social links.",
      category: "Profile"
    }
  ];

  const categories = ["All", "Projects", "Team", "Billing", "Features", "Collaboration", "Export", "Account", "Profile"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  if (authLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className={styles.error}>Please log in to access help.</div>;
  }

  return (
    <div className={styles.helpPage}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem="help"
      />

      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={user}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>Help & Support</h1>
            <p className={styles.subtitle}>Find answers to common questions and get support</p>
          </header>

          <div className={styles.helpContainer}>
            {/* Search and Filters */}
            <div className={styles.searchSection}>
              <div className={styles.searchBar}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={styles.searchIcon}>
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              
              <div className={styles.categoryFilters}>
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`${styles.categoryBtn} ${selectedCategory === category ? styles.activeCategory : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div className={styles.faqSection}>
              <h2>Frequently Asked Questions</h2>
              <div className={styles.faqList}>
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className={styles.faqItem}>
                    <button
                      className={styles.faqQuestion}
                      onClick={() => toggleFaq(faq.id)}
                    >
                      <div className={styles.questionContent}>
                        <span className={styles.questionText}>{faq.question}</span>
                        <span className={styles.categoryTag}>{faq.category}</span>
                      </div>
                      <svg 
                        className={`${styles.expandIcon} ${expandedFaq === faq.id ? styles.expanded : ''}`}
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none"
                      >
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                    {expandedFaq === faq.id && (
                      <div className={styles.faqAnswer}>
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <div className={styles.contactSection}>
              <h2>Still Need Help?</h2>
              <p className={styles.contactDescription}>
                Can't find what you're looking for? We're here to help!
              </p>
              
              <div className={styles.contactMethods}>
                <div className={styles.contactCard}>
                  <div className={styles.contactIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className={styles.contactInfo}>
                    <h3>Email Support</h3>
                    <p>Get help via email</p>
                    <a href="mailto:support@example.com" className={styles.contactLink}>
                      support@example.com
                    </a>
                  </div>
                </div>

                <div className={styles.contactCard}>
                  <div className={styles.contactIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className={styles.contactInfo}>
                    <h3>Live Chat</h3>
                    <p>Chat with our support team</p>
                    <button className={styles.contactButton}>
                      Start Chat
                    </button>
                  </div>
                </div>

                <div className={styles.contactCard}>
                  <div className={styles.contactIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className={styles.contactInfo}>
                    <h3>Phone Support</h3>
                    <p>Call us directly</p>
                    <a href="tel:+1-555-123-4567" className={styles.contactLink}>
                      +1 (555) 123-4567
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className={styles.quickLinksSection}>
              <h2>Quick Links</h2>
              <div className={styles.quickLinks}>
                <a href="/dashboard/profile" className={styles.quickLink}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Profile Settings
                </a>
                <a href="/dashboard/billing" className={styles.quickLink}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Billing & Plans
                </a>
                <a href="/dashboard/team" className={styles.quickLink}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Team Management
                </a>
                <a href="/dashboard/chat" className={styles.quickLink}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Chat Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
