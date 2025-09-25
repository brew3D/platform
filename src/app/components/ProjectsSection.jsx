"use client";

import React, { useState } from "react";
import { useProjects } from "../contexts/ProjectsContext";
import styles from "./ProjectsSection.module.css";

export default function ProjectsSection({ projects = [], loading = false, activeProject, onProjectSelect }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('lastModified');

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress': return '#8a2be2';
      case 'Review': return '#ffd93d';
      case 'Draft': return '#4ecdc4';
      case 'Completed': return '#4ecdc4';
      default: return '#667eea';
    }
  };

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

  const sortedProjects = [...projects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'lastModified':
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      case 'created':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });

  return (
    <section className={styles.projectsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerContent}>
          <h2 className={styles.sectionTitle}>Your Projects</h2>
          <p className={styles.sectionSubtitle}>
            Manage and collaborate on your game development projects
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.viewControls}>
            <button 
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
            <button 
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2"/>
                <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2"/>
                <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2"/>
                <line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>

          <select 
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="lastModified">Last Modified</option>
            <option value="name">Name</option>
            <option value="created">Created</option>
          </select>

          <button className={styles.newProjectButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
            </svg>
            New Project
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading projects...</p>
        </div>
      ) : (
        <div className={`${styles.projectsContainer} ${viewMode === 'list' ? styles.listView : styles.gridView}`}>
          {sortedProjects.map((project) => (
            <div
              key={project.projectId}
              className={`${styles.projectCard} ${activeProject === project.projectId ? styles.active : ''}`}
              onClick={() => onProjectSelect(project.projectId)}
            >
            <div className={styles.projectThumbnail}>
              <div className={styles.thumbnailPlaceholder}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className={styles.projectOverlay}>
                <button className={styles.quickAction}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                <button className={styles.quickAction}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                <button className={styles.quickAction}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.projectContent}>
              <div className={styles.projectHeader}>
                <h3 className={styles.projectName}>{project.name}</h3>
                <div 
                  className={styles.statusBadge}
                  style={{ '--status-color': getStatusColor(project.status) }}
                >
                  {project.status}
                </div>
              </div>

              <p className={styles.projectDescription}>{project.description}</p>

              <div className={styles.projectMeta}>
                <div className={styles.projectInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Type:</span>
                    <span className={styles.infoValue}>{project.settings?.gameType || 'Unknown'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Platform:</span>
                    <span className={styles.infoValue}>{project.settings?.platform || 'Web'}</span>
                  </div>
                </div>

                <div className={styles.projectTags}>
                  <span className={styles.tag}>{project.settings?.template || 'Blank'}</span>
                  <span className={styles.tag}>{project.settings?.gameType || 'Game'}</span>
                </div>
              </div>

              <div className={styles.projectFooter}>
                <div className={styles.teamMembers}>
                  <div className={styles.memberAvatars}>
                    {project.teamMembers?.slice(0, 3).map((memberId, index) => (
                      <div
                        key={index}
                        className={styles.memberAvatar}
                        title={`Member ${index + 1}`}
                      >
                        {memberId.substring(0, 2).toUpperCase()}
                      </div>
                    ))}
                    {project.teamMembers?.length > 3 && (
                      <div className={styles.moreMembers}>
                        +{project.teamMembers.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.lastModified}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {formatLastModified(project.updatedAt || project.createdAt)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

        )}
      )}

      {!loading && sortedProjects.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No projects yet</h3>
          <p className={styles.emptyDescription}>
            Create your first game project or browse our template gallery to get started.
          </p>
          <button className={styles.emptyAction}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Create Your First Project
          </button>
        </div>
      )}
    </section>
  );
}
