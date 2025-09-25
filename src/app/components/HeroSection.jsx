"use client";

import React from "react";
import { useProjects } from "../contexts/ProjectsContext";
import styles from "./HeroSection.module.css";

export default function HeroSection({ activeProject, onCreateProject, onScrollToProjects }) {
  const { projects } = useProjects();
  
  // Get the most recent project
  const recentProject = projects && projects.length > 0 
    ? projects.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))[0]
    : null;

  const formatLastModified = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

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
          {recentProject ? (
            <div className={styles.recentProject}>
              <div className={styles.projectCard}>
                <div className={styles.projectThumbnail}>
                  <div className={styles.thumbnailPlaceholder}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                      <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>
                
                <div className={styles.projectInfo}>
                  <h3 className={styles.projectTitle}>Recent Project</h3>
                  <p className={styles.projectName}>{recentProject.name}</p>
                  <div className={styles.projectMeta}>
                    <span className={styles.projectStatus}>{recentProject.status}</span>
                    <span className={styles.lastModified}>
                      {formatLastModified(recentProject.updatedAt || recentProject.createdAt)}
                    </span>
                  </div>
                </div>
                
                <button 
                  className={styles.continueButton}
                  onClick={() => onCreateProject && onCreateProject(recentProject.projectId)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Continue Working
                </button>
              </div>
              
              <div className={styles.createNewSection}>
                <button 
                  className={styles.createNewButton}
                  onClick={onScrollToProjects}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Create New Project
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.createSection}>
              <button 
                className={styles.createButton}
                onClick={onScrollToProjects}
              >
                <div className={styles.buttonIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className={styles.buttonContent}>
                  <span className={styles.buttonTitle}>Create Your First Project</span>
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
