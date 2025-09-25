"use client";

import React, { useState } from "react";
import styles from "./TemplateGallery.module.css";

const templates = [
  {
    id: 'platformer',
    name: 'Platformer',
    description: 'Classic 2D side-scrolling adventure with jumping mechanics',
    category: '2D',
    difficulty: 'Beginner',
    thumbnail: '/api/placeholder/300/200',
    features: ['Jump mechanics', 'Enemy AI', 'Collectibles', 'Level progression'],
    color: '#8a2be2'
  },
  {
    id: 'rpg',
    name: 'RPG Adventure',
    description: 'Epic role-playing game with character progression and quests',
    category: '2D/3D',
    difficulty: 'Intermediate',
    thumbnail: '/api/placeholder/300/200',
    features: ['Character stats', 'Inventory system', 'Dialogue trees', 'Combat system'],
    color: '#667eea'
  },
  {
    id: 'fps',
    name: 'First Person Shooter',
    description: 'Fast-paced action with modern FPS mechanics',
    category: '3D',
    difficulty: 'Advanced',
    thumbnail: '/api/placeholder/300/200',
    features: ['Weapon systems', 'Multiplayer ready', 'Physics engine', 'Audio system'],
    color: '#ff6b6b'
  },
  {
    id: 'puzzle',
    name: 'Puzzle Game',
    description: 'Mind-bending puzzles with creative mechanics',
    category: '2D',
    difficulty: 'Beginner',
    thumbnail: '/api/placeholder/300/200',
    features: ['Level editor', 'Hint system', 'Progress tracking', 'Multiple solutions'],
    color: '#4ecdc4'
  },
  {
    id: 'endless-runner',
    name: 'Endless Runner',
    description: 'Infinite running adventure with procedural generation',
    category: '2D',
    difficulty: 'Intermediate',
    thumbnail: '/api/placeholder/300/200',
    features: ['Procedural levels', 'Power-ups', 'Leaderboards', 'Mobile optimized'],
    color: '#ffd93d'
  },
  {
    id: 'strategy',
    name: 'Strategy Game',
    description: 'Turn-based or real-time strategy with resource management',
    category: '2D/3D',
    difficulty: 'Advanced',
    thumbnail: '/api/placeholder/300/200',
    features: ['Resource management', 'Unit AI', 'Map editor', 'Multiplayer support'],
    color: '#a8e6cf'
  }
];

export default function TemplateGallery() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

  const categories = ['All', '2D', '3D', '2D/3D'];
  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  return (
    <section className={styles.templateGallery}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Template Gallery</h2>
        <p className={styles.sectionSubtitle}>
          Choose from our collection of professionally designed game templates
        </p>
      </div>

      <div className={styles.categoryFilter}>
        {categories.map((category) => (
          <button
            key={category}
            className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className={styles.templatesGrid}>
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`${styles.templateCard} ${hoveredTemplate === template.id ? styles.hovered : ''}`}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
            style={{ '--template-color': template.color }}
          >
            <div className={styles.templateThumbnail}>
              <div className={styles.thumbnailPlaceholder}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className={styles.templateOverlay}>
                <button className={styles.previewButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Preview
                </button>
                <button className={styles.startButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <polygon points="5,3 19,12 5,21" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Start from Template
                </button>
              </div>
            </div>

            <div className={styles.templateContent}>
              <div className={styles.templateHeader}>
                <h3 className={styles.templateName}>{template.name}</h3>
                <div className={styles.templateMeta}>
                  <span className={styles.templateCategory}>{template.category}</span>
                  <span className={styles.templateDifficulty}>{template.difficulty}</span>
                </div>
              </div>

              <p className={styles.templateDescription}>{template.description}</p>

              <div className={styles.templateFeatures}>
                {template.features.slice(0, 3).map((feature, index) => (
                  <span key={index} className={styles.featureTag}>
                    {feature}
                  </span>
                ))}
                {template.features.length > 3 && (
                  <span className={styles.moreFeatures}>
                    +{template.features.length - 3} more
                  </span>
                )}
              </div>

              <div className={styles.templateActions}>
                <button className={styles.actionButton}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Preview
                </button>
                <button className={`${styles.actionButton} ${styles.primaryAction}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <polygon points="5,3 19,12 5,21" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Start Project
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.galleryFooter}>
        <button className={styles.browseAllButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Browse All Templates
        </button>
      </div>
    </section>
  );
}
