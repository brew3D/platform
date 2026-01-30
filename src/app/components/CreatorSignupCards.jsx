"use client";

import React, { useState } from "react";
import styles from "./CreatorSignupCards.module.css";

const creatorTypes = [
  {
    id: 'template',
    title: 'Template Creator',
    description: 'Upload game templates and earn from downloads and sales',
    icon: '🎮',
    features: [
      'Upload game templates',
      'Track downloads & sales',
      'Earn from template marketplace',
      'Community recognition'
    ],
    earnings: 'Up to 70% revenue share',
    color: '#6b4423'
  },
  {
    id: 'asset',
    title: 'Asset Creator',
    description: 'Create and sell 3D models, props, materials, and textures',
    icon: '🎨',
    features: [
      '3D models & props',
      'Materials & textures',
      'Animation assets',
      'Sound effects & music'
    ],
    earnings: 'Up to 80% revenue share',
    color: '#8b5a2b'
  },
  {
    id: 'game',
    title: 'Game Creator',
    description: 'Host web games and earn from sales and in-game purchases',
    icon: '🚀',
    features: [
      'Host web games',
      'In-game purchases',
      'Subscription models',
      'Analytics & insights'
    ],
    earnings: 'Up to 90% revenue share',
    color: '#4ecdc4'
  }
];

export default function CreatorSignupCards({ onSignup }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleSignup = (type) => {
    // Add ripple effect
    const button = document.querySelector(`[data-type="${type}"]`);
    if (button) {
      button.classList.add(styles.ripple);
      setTimeout(() => button.classList.remove(styles.ripple), 600);
    }
    
    // Call parent handler
    onSignup(type);
  };

  return (
    <div className={styles.cardsContainer}>
      {creatorTypes.map((creator, index) => (
        <div
          key={creator.id}
          className={`${styles.creatorCard} ${hoveredCard === creator.id ? styles.hovered : ''}`}
          onMouseEnter={() => setHoveredCard(creator.id)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{ 
            '--creator-color': creator.color,
            animationDelay: `${index * 150}ms`
          }}
        >
          <div className={styles.cardHeader}>
            <div className={styles.iconContainer}>
              <div className={styles.icon}>{creator.icon}</div>
              <div className={styles.iconGlow}></div>
            </div>
            <div className={styles.cardTitle}>{creator.title}</div>
            <div className={styles.earningsBadge}>{creator.earnings}</div>
          </div>

          <div className={styles.cardContent}>
            <p className={styles.description}>{creator.description}</p>
            
            <div className={styles.featuresList}>
              {creator.features.map((feature, index) => (
                <div key={index} className={styles.featureItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.cardFooter}>
            <button
              className={styles.signupButton}
              onClick={() => handleSignup(creator.id)}
              data-type={creator.id}
            >
              <span className={styles.buttonText}>Sign Up</span>
              <div className={styles.buttonGlow}></div>
              <div className={styles.rippleEffect}></div>
            </button>
          </div>

          <div className={styles.cardAccent}></div>
        </div>
      ))}
    </div>
  );
}
