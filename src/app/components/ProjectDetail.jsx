"use client";

import React, { useState } from "react";
import styles from "./ProjectDetail.module.css";

const projectTabs = [
  {
    id: 'scenes',
    label: 'Scenes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    description: 'Manage your game scenes, animations, and visual sequences'
  },
  {
    id: 'assembler',
    label: 'Assembler',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M9 11H5a2 2 0 00-2 2v3c0 1.1.9 2 2 2h4m0-7V9a2 2 0 012-2h4a2 2 0 012 2v2m-6 0h6m-6 0v7a2 2 0 002 2h4a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    description: 'Node-based visual editor for assembling scenes, maps, and props'
  },
  {
    id: 'script',
    label: 'Script',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
        <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    description: 'Write dialogue, gameplay logic, and interactive sequences'
  },
  {
    id: 'characters',
    label: 'Characters',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    description: 'Design and manage characters, NPCs, and player avatars'
  },
  {
    id: 'props',
    label: 'Custom Props',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2"/>
        <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
        <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    description: 'Create and customize 3D objects, items, and interactive elements'
  },
  {
    id: 'maps',
    label: 'Maps',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" stroke="currentColor" strokeWidth="2"/>
        <polyline points="8,2 8,18" stroke="currentColor" strokeWidth="2"/>
        <polyline points="16,6 16,22" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    description: 'Design levels, environments, and world layouts'
  }
];

export default function ProjectDetail({ projectId, projectName, onClose }) {
  const [activeTab, setActiveTab] = useState('scenes');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'scenes':
        return (
          <div className={styles.tabContent}>
            <div className={styles.placeholderContent}>
              <div className={styles.placeholderIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Scene Management</h3>
              <p>Create and organize your game scenes with our powerful animation tools.</p>
              <button className={styles.actionButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Create New Scene
              </button>
            </div>
          </div>
        );
      
      case 'assembler':
        return (
          <div className={styles.tabContent}>
            <div className={styles.placeholderContent}>
              <div className={styles.placeholderIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11H5a2 2 0 00-2 2v3c0 1.1.9 2 2 2h4m0-7V9a2 2 0 012-2h4a2 2 0 012 2v2m-6 0h6m-6 0v7a2 2 0 002 2h4a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Visual Assembler</h3>
              <p>Connect scenes, maps, and props in a node-based visual editor.</p>
              <button className={styles.actionButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Open Assembler
              </button>
            </div>
          </div>
        );
      
      case 'script':
        return (
          <div className={styles.tabContent}>
            <div className={styles.placeholderContent}>
              <div className={styles.placeholderIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Script Editor</h3>
              <p>Write dialogue, gameplay logic, and interactive sequences.</p>
              <button className={styles.actionButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                New Script
              </button>
            </div>
          </div>
        );
      
      case 'characters':
        return (
          <div className={styles.tabContent}>
            <div className={styles.placeholderContent}>
              <div className={styles.placeholderIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Character Designer</h3>
              <p>Create and customize characters, NPCs, and player avatars.</p>
              <button className={styles.actionButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Create Character
              </button>
            </div>
          </div>
        );
      
      case 'props':
        return (
          <div className={styles.tabContent}>
            <div className={styles.placeholderContent}>
              <div className={styles.placeholderIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>3D Editor</h3>
              <p>Create and customize 3D objects, items, and interactive elements.</p>
              <button className={styles.actionButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Open 3D Editor
              </button>
            </div>
          </div>
        );
      
      case 'maps':
        return (
          <div className={styles.tabContent}>
            <div className={styles.placeholderContent}>
              <div className={styles.placeholderIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Map Editor</h3>
              <p>Design levels, environments, and world layouts.</p>
              <button className={styles.actionButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Create Map
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={styles.projectDetail}>
      <div className={styles.projectHeader}>
        <div className={styles.projectInfo}>
          <h1 className={styles.projectTitle}>{projectName}</h1>
          <p className={styles.projectSubtitle}>Game Development Project</p>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>

      <div className={styles.tabNavigation}>
        {projectTabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <div className={styles.tabIcon}>
              {tab.icon}
            </div>
            <div className={styles.tabContent}>
              <span className={styles.tabLabel}>{tab.label}</span>
              <span className={styles.tabDescription}>{tab.description}</span>
            </div>
          </button>
        ))}
      </div>

      <div className={styles.tabPanel}>
        {renderTabContent()}
      </div>
    </div>
  );
}
