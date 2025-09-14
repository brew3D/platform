"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./help.module.css";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: '📚' },
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'features', name: 'Features', icon: '⚡' },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' },
    { id: 'billing', name: 'Billing', icon: '💳' },
    { id: 'api', name: 'API & Integrations', icon: '🔌' }
  ];

  const articles = [
    {
      id: 1,
      title: 'Getting Started with Simo',
      category: 'getting-started',
      excerpt: 'Learn the basics of creating your first 3D model with Simo\'s AI-powered tools.',
      readTime: '5 min read',
      difficulty: 'Beginner'
    },
    {
      id: 2,
      title: 'Understanding Edge Manipulation',
      category: 'features',
      excerpt: 'Master the art of resizing and manipulating objects using edge handles.',
      readTime: '8 min read',
      difficulty: 'Intermediate'
    },
    {
      id: 3,
      title: 'AI Prompt Best Practices',
      category: 'features',
      excerpt: 'Get the most out of Simo\'s AI by crafting effective prompts for your 3D models.',
      readTime: '6 min read',
      difficulty: 'Beginner'
    },
    {
      id: 4,
      title: 'Exporting Your Models',
      category: 'features',
      excerpt: 'Learn how to export your 3D models in various formats for different use cases.',
      readTime: '4 min read',
      difficulty: 'Beginner'
    },
    {
      id: 5,
      title: 'Troubleshooting Performance Issues',
      category: 'troubleshooting',
      excerpt: 'Common performance issues and how to resolve them for smooth 3D modeling.',
      readTime: '7 min read',
      difficulty: 'Intermediate'
    },
    {
      id: 6,
      title: 'Understanding Billing and Subscriptions',
      category: 'billing',
      excerpt: 'Everything you need to know about Simo\'s pricing plans and billing cycles.',
      readTime: '3 min read',
      difficulty: 'Beginner'
    },
    {
      id: 7,
      title: 'API Documentation',
      category: 'api',
      excerpt: 'Complete guide to integrating Simo\'s API into your applications.',
      readTime: '15 min read',
      difficulty: 'Advanced'
    },
    {
      id: 8,
      title: 'Creating Complex Scenes',
      category: 'features',
      excerpt: 'Advanced techniques for building intricate 3D scenes with multiple objects.',
      readTime: '12 min read',
      difficulty: 'Advanced'
    }
  ];

  const faqs = [
    {
      question: 'How do I create my first 3D model?',
      answer: 'Start by clicking "Try It Out" to access the editor. Use the AI prompt feature to describe what you want to create, or manually add objects using the + buttons. Select objects to see edge handles for resizing.'
    },
    {
      question: 'What file formats can I export?',
      answer: 'Simo supports OBJ, FBX, STL, GLTF, and custom JSON formats. Pro users get access to additional formats and higher resolution exports.'
    },
    {
      question: 'How does the AI prompt feature work?',
      answer: 'Simply describe what you want to create in natural language. Our AI will generate the 3D model based on your description. Be specific about dimensions, materials, and style for best results.'
    },
    {
      question: 'Can I collaborate with others?',
      answer: 'Yes! Pro and Enterprise users can share projects and collaborate in real-time. You can invite team members and work together on the same 3D scene.'
    },
    {
      question: 'What\'s the difference between Free and Pro?',
      answer: 'Free users get 5 projects per month with basic features. Pro users get unlimited projects, advanced AI prompts, cloud storage, and collaboration tools.'
    },
    {
      question: 'How do I resize objects precisely?',
      answer: 'Select any object to see colored edge handles. Drag the handles to resize in that direction. Red handles control width, cyan controls height, and blue controls depth.'
    }
  ];

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#00d4ff';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ec4899';
      default: return '#00d4ff';
    }
  };

  return (
    <div className={styles.help}>
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
            <Link href="/help" className={styles.navLink}>Help</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Help
              <span className={styles.gradientText}> Center</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Find answers, tutorials, and guides to help you master 3D modeling with Simo.
            </p>
            
            {/* Search Bar */}
            <div className={styles.searchContainer}>
              <div className={styles.searchInput}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchField}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className={styles.categoriesSection}>
        <div className={styles.container}>
          <div className={styles.categories}>
            {categories.map(category => (
              <button
                key={category.id}
                className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.active : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span className={styles.categoryName}>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className={styles.articlesSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Articles' : categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          
          <div className={styles.articlesGrid}>
            {filteredArticles.map(article => (
              <div key={article.id} className={styles.articleCard}>
                <div className={styles.articleHeader}>
                  <div className={styles.articleMeta}>
                    <span 
                      className={styles.difficulty}
                      style={{ color: getDifficultyColor(article.difficulty) }}
                    >
                      {article.difficulty}
                    </span>
                    <span className={styles.readTime}>{article.readTime}</span>
                  </div>
                </div>
                <h3 className={styles.articleTitle}>{article.title}</h3>
                <p className={styles.articleExcerpt}>{article.excerpt}</p>
                <div className={styles.articleFooter}>
                  <Link href={`/help/article/${article.id}`} className={styles.readMore}>
                    Read More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqGrid}>
            {faqs.map((faq, index) => (
              <div key={index} className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>{faq.question}</h3>
                <p className={styles.faqAnswer}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className={styles.contactSection}>
        <div className={styles.container}>
          <div className={styles.contactCard}>
            <h2 className={styles.contactTitle}>Still Need Help?</h2>
            <p className={styles.contactSubtitle}>
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className={styles.contactButtons}>
              <Link href="/contact" className={styles.contactButton}>
                Contact Support
              </Link>
              <Link href="/editor" className={styles.tryButton}>
                Try Simo Now
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
