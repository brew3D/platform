"use client";

import React, { useState } from "react";
import styles from "./ProjectsSection.module.css";

const mockProjects = [
  {
    id: 'space-adventure',
    name: 'Space Adventure',
    description: 'Epic space exploration game with procedurally generated worlds',
    lastModified: '2 hours ago',
    status: 'In Progress',
    teamMembers: [
      { name: 'John Doe', avatar: 'JD', color: '#8a2be2' },
      { name: 'Jane Smith', avatar: 'JS', color: '#667eea' },
      { name: 'Mike Johnson', avatar: 'MJ', color: '#ff6b6b' }
    ],
    thumbnail: '/api/placeholder/200/150',
    progress: 75,
    tags: ['3D', 'Space', 'Adventure']
  },
  {
    id: 'pixel-platformer',
    name: 'Pixel Platformer',
    description: 'Retro-style 2D platformer with pixel art graphics',
    lastModified: '1 day ago',
    status: 'Review',
    teamMembers: [
      { name: 'Sarah Wilson', avatar: 'SW', color: '#4ecdc4' },
      { name: 'Tom Brown', avatar: 'TB', color: '#ffd93d' }
    ],
    thumbnail: '/api/placeholder/200/150',
    progress: 90,
    tags: ['2D', 'Pixel Art', 'Platformer']
  },
  {
    id: 'mystery-puzzle',
    name: 'Mystery Puzzle',
    description: 'Mind-bending puzzle game with atmospheric storytelling',
    lastModified: '3 days ago',
    status: 'Draft',
    teamMembers: [
      { name: 'Alex Chen', avatar: 'AC', color: '#a8e6cf' }
    ],
    thumbnail: '/api/placeholder/200/150',
    progress: 45,
    tags: ['Puzzle', 'Mystery', 'Story']
  },
  {
    id: 'racing-game',
    name: 'Racing Game',
    description: 'High-speed racing with realistic physics and multiplayer',
    lastModified: '1 week ago',
    status: 'Completed',
    teamMembers: [
      { name: 'Emma Davis', avatar: 'ED', color: '#ff9a9e' },
      { name: 'Chris Lee', avatar: 'CL', color: '#fecfef' },
      { name: 'Lisa Wang', avatar: 'LW', color: '#c7ceea' }
    ],
    thumbnail: '/api/placeholder/200/150',
    progress: 100,
    tags: ['Racing', 'Multiplayer', '3D']
  }
];

export default function ProjectsSection({ activeProject, onProjectSelect }) {
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

  const sortedProjects = [...mockProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'lastModified':
        return new Date(b.lastModified) - new Date(a.lastModified);
      case 'progress':
        return b.progress - a.progress;
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
            <option value="progress">Progress</option>
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

      <div className={`${styles.projectsContainer} ${viewMode === 'list' ? styles.listView : styles.gridView}`}>
        {sortedProjects.map((project) => (
          <div
            key={project.id}
            className={`${styles.projectCard} ${activeProject === project.id ? styles.active : ''}`}
            onClick={() => onProjectSelect(project.id)}
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
                <div className={styles.progressContainer}>
                  <div className={styles.progressLabel}>
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className={styles.projectTags}>
                  {project.tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.projectFooter}>
                <div className={styles.teamMembers}>
                  <div className={styles.memberAvatars}>
                    {project.teamMembers.slice(0, 3).map((member, index) => (
                      <div
                        key={index}
                        className={styles.memberAvatar}
                        style={{ '--member-color': member.color }}
                        title={member.name}
                      >
                        {member.avatar}
                      </div>
                    ))}
                    {project.teamMembers.length > 3 && (
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
                  {project.lastModified}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedProjects.length === 0 && (
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
