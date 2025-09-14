"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./blog.module.css";

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Posts', icon: '📚' },
    { id: 'tutorials', name: 'Tutorials', icon: '🎓' },
    { id: 'features', name: 'Features', icon: '⚡' },
    { id: 'industry', name: 'Industry', icon: '🏭' },
    { id: 'ai', name: 'AI & Tech', icon: '🤖' }
  ];

  const blogPosts = [
    {
      id: 1,
      title: 'Getting Started with AI-Powered 3D Modeling',
      excerpt: 'Learn the fundamentals of creating 3D models using natural language prompts and discover how AI is revolutionizing the creative process.',
      category: 'tutorials',
      author: 'Sarah Johnson',
      date: '2024-01-15',
      readTime: '8 min read',
      image: '🎨',
      featured: true
    },
    {
      id: 2,
      title: 'The Future of 3D Design: Trends to Watch in 2024',
      excerpt: 'Explore the latest trends in 3D design and how emerging technologies are shaping the future of digital creation.',
      category: 'industry',
      author: 'Alex Chen',
      date: '2024-01-12',
      readTime: '6 min read',
      image: '🚀',
      featured: false
    },
    {
      id: 3,
      title: 'Mastering Edge Manipulation in Simo',
      excerpt: 'A comprehensive guide to using edge handles for precise object manipulation and resizing in your 3D models.',
      category: 'tutorials',
      author: 'Michael Rodriguez',
      date: '2024-01-10',
      readTime: '10 min read',
      image: '⚡',
      featured: false
    },
    {
      id: 4,
      title: 'How AI is Democratizing 3D Creation',
      excerpt: 'Discover how artificial intelligence is making 3D modeling accessible to everyone, from beginners to professionals.',
      category: 'ai',
      author: 'Emily Watson',
      date: '2024-01-08',
      readTime: '7 min read',
      image: '🤖',
      featured: true
    },
    {
      id: 5,
      title: 'New Collaboration Features in Simo Pro',
      excerpt: 'Learn about the latest collaboration tools that make it easier than ever to work together on 3D projects.',
      category: 'features',
      author: 'David Kim',
      date: '2024-01-05',
      readTime: '5 min read',
      image: '👥',
      featured: false
    },
    {
      id: 6,
      title: 'The Psychology of 3D Design: Understanding User Experience',
      excerpt: 'Explore how 3D design principles impact user experience and learn techniques to create more engaging models.',
      category: 'industry',
      author: 'Lisa Park',
      date: '2024-01-03',
      readTime: '9 min read',
      image: '🧠',
      featured: false
    },
    {
      id: 7,
      title: 'Exporting Your Models: A Complete Guide',
      excerpt: 'Everything you need to know about exporting your 3D models in different formats for various use cases.',
      category: 'tutorials',
      author: 'Sarah Johnson',
      date: '2024-01-01',
      readTime: '6 min read',
      image: '📤',
      featured: false
    },
    {
      id: 8,
      title: 'The Evolution of 3D Modeling Software',
      excerpt: 'A look back at the history of 3D modeling software and how we got to where we are today.',
      category: 'industry',
      author: 'Alex Chen',
      date: '2023-12-28',
      readTime: '12 min read',
      image: '📈',
      featured: false
    }
  ];

  const filteredPosts = blogPosts.filter(post => 
    selectedCategory === 'all' || post.category === selectedCategory
  );

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className={styles.blog}>
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
            <Link href="/blog" className={styles.navLink}>Blog</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Simo
              <span className={styles.gradientText}> Blog</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Insights, tutorials, and stories from the world of AI-powered 3D modeling.
            </p>
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

      {/* Featured Posts */}
      {selectedCategory === 'all' && (
        <section className={styles.featuredSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Featured Articles</h2>
            <div className={styles.featuredGrid}>
              {featuredPosts.map(post => (
                <article key={post.id} className={styles.featuredCard}>
                  <div className={styles.postImage}>{post.image}</div>
                  <div className={styles.postContent}>
                    <div className={styles.postMeta}>
                      <span className={styles.postCategory}>{post.category}</span>
                      <span className={styles.postDate}>{formatDate(post.date)}</span>
                    </div>
                    <h3 className={styles.postTitle}>{post.title}</h3>
                    <p className={styles.postExcerpt}>{post.excerpt}</p>
                    <div className={styles.postFooter}>
                      <div className={styles.postAuthor}>
                        <span className={styles.authorName}>{post.author}</span>
                        <span className={styles.readTime}>{post.readTime}</span>
                      </div>
                      <Link href={`/blog/post/${post.id}`} className={styles.readMore}>
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Posts */}
      <section className={styles.postsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Articles' : categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          <div className={styles.postsGrid}>
            {regularPosts.map(post => (
              <article key={post.id} className={styles.postCard}>
                <div className={styles.postImage}>{post.image}</div>
                <div className={styles.postContent}>
                  <div className={styles.postMeta}>
                    <span className={styles.postCategory}>{post.category}</span>
                    <span className={styles.postDate}>{formatDate(post.date)}</span>
                  </div>
                  <h3 className={styles.postTitle}>{post.title}</h3>
                  <p className={styles.postExcerpt}>{post.excerpt}</p>
                  <div className={styles.postFooter}>
                    <div className={styles.postAuthor}>
                      <span className={styles.authorName}>{post.author}</span>
                      <span className={styles.readTime}>{post.readTime}</span>
                    </div>
                    <Link href={`/blog/post/${post.id}`} className={styles.readMore}>
                      Read More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className={styles.newsletterSection}>
        <div className={styles.container}>
          <div className={styles.newsletterCard}>
            <h2 className={styles.newsletterTitle}>Stay Updated</h2>
            <p className={styles.newsletterSubtitle}>
              Get the latest articles, tutorials, and product updates delivered to your inbox.
            </p>
            <div className={styles.newsletterForm}>
              <input
                type="email"
                placeholder="Enter your email address"
                className={styles.newsletterInput}
              />
              <button className={styles.newsletterButton}>
                Subscribe
              </button>
            </div>
            <p className={styles.newsletterNote}>
              No spam, unsubscribe at any time.
            </p>
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
