"use client";

import React from "react";
import styles from "./HeroSection.module.css";

export default function HeroSection({ activeProject, onCreateProject }) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            Welcome back, <span className={styles.gradientText}>Creator</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Ready to build your next amazing game? Choose from our templates or start from scratch.
          </p>
        </div>

        <div className={styles.heroActions}>
          {activeProject ? (
            <div className={styles.currentProject}>
              <div className={styles.projectInfo}>
                <h3 className={styles.projectTitle}>Current Project</h3>
                <p className={styles.projectName}>{activeProject}</p>
                <span className={styles.projectStatus}>In Progress</span>
              </div>
              <button className={styles.continueButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Continue Working
              </button>
            </div>
          ) : (
            <div className={styles.createSection}>
              <button 
                className={styles.createButton}
                onClick={onCreateProject}
              >
                <div className={styles.buttonIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className={styles.buttonContent}>
                  <span className={styles.buttonTitle}>Create New Project</span>
                  <span className={styles.buttonSubtitle}>Start building your game</span>
                </div>
                <div className={styles.buttonGlow}></div>
              </button>

              <div className={styles.quickActions}>
                <button className={styles.quickAction}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Browse Templates
                </button>
                <button className={styles.quickAction}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Invite Team
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.heroVisual}>
        <div className={styles.floatingElements}>
          <div className={`${styles.floatingElement} ${styles.element1}`}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className={`${styles.floatingElement} ${styles.element2}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className={`${styles.floatingElement} ${styles.element3}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className={`${styles.floatingElement} ${styles.element4}`}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
