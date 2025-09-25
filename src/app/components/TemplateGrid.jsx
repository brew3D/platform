"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TemplatePreview from "./TemplatePreview";
import TemplateRenameModal from "./TemplateRenameModal";
import styles from "./TemplateGrid.module.css";

export default function TemplateGrid({ groupedTemplates, searchQuery, onCreateProject }) {
  const [visibleTiers, setVisibleTiers] = useState(new Set());
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [renameModal, setRenameModal] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Animate tiers in sequence
    groupedTemplates.forEach((tier, index) => {
      if (tier.templates.length > 0) {
        setTimeout(() => {
          setVisibleTiers(prev => new Set([...prev, tier.id]));
        }, index * 200);
      }
    });
  }, [groupedTemplates]);

  const handleStartProject = (template) => {
    setRenameModal(template);
  };

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  const handleCloseRenameModal = () => {
    setRenameModal(null);
  };

  const handleConfirmRename = (projectData) => {
    if (onCreateProject) {
      onCreateProject(projectData);
    }
    setRenameModal(null);
  };

  return (
    <div className={styles.templateGrid}>
      {groupedTemplates.map((tier) => (
        <div key={tier.id} className={styles.tierSection}>
          {tier.templates.length > 0 && (
            <>
              <div 
                className={styles.tierHeader}
                style={{ '--tier-color': tier.color }}
              >
                <div className={styles.tierTitleContainer}>
                  <h2 className={styles.tierTitle}>{tier.name}</h2>
                  <p className={styles.tierDescription}>{tier.description}</p>
                </div>
                <div className={styles.tierStats}>
                  <span className={styles.templateCount}>
                    {tier.templates.length} template{tier.templates.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div 
                className={`${styles.templatesContainer} ${visibleTiers.has(tier.id) ? styles.visible : ''}`}
              >
                {tier.templates.map((template, index) => (
                  <div
                    key={template.id}
                    className={`${styles.templateCard} ${hoveredTemplate === template.id ? styles.hovered : ''}`}
                    onMouseEnter={() => setHoveredTemplate(template.id)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    style={{ 
                      '--tier-color': tier.color,
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className={styles.templateThumbnail}>
                      <div className={styles.thumbnailImage}>
                        <div className={styles.placeholderImage}>
                          <div className={styles.templateIcon}>{template.icon}</div>
                          <div className={styles.animatedElement}>
                            <div className={styles.spinningObject}></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.templateOverlay}>
                        <button 
                          className={styles.previewButton}
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          Preview
                        </button>
                        <button 
                          className={styles.startButton}
                          onClick={() => handleStartProject(template)}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <polygon points="5,3 19,12 5,21" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          Start Project
                        </button>
                      </div>

                      <div className={styles.tierBadge} style={{ '--tier-color': tier.color }}>
                        {tier.name.split(' – ')[0]}
                      </div>
                    </div>

                    <div className={styles.templateContent}>
                      <div className={styles.templateHeader}>
                        <h3 className={styles.templateName}>{template.name}</h3>
                        <div className={styles.templateMeta}>
                          <span className={styles.categoryBadge}>{template.category}</span>
                          <span className={styles.difficultyBadge}>{template.difficulty}</span>
                        </div>
                      </div>

                      <p className={styles.templateDescription}>{template.description}</p>

                      <div className={styles.templateStats}>
                        <div className={styles.stat}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 11H5a2 2 0 00-2 2v3c0 1.1.9 2 2 2h4m0-7V9a2 2 0 012-2h4a2 2 0 012 2v2m-6 0h6m-6 0v7a2 2 0 002 2h4a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>{template.mechanics} mechanics</span>
                        </div>
                        <div className={styles.stat}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>{template.estimatedTime}</span>
                        </div>
                        <div className={styles.stat}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>{template.popularity}% popular</span>
                        </div>
                      </div>

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
                        <button 
                          className={styles.actionButton}
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          Preview
                        </button>
                        <button 
                          className={`${styles.actionButton} ${styles.primaryAction}`}
                          onClick={() => handleStartProject(template)}
                        >
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
            </>
          )}
        </div>
      ))}

      {groupedTemplates.every(tier => tier.templates.length === 0) && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No templates found</h3>
          <p className={styles.emptyDescription}>
            Try adjusting your search or filter criteria to find the perfect template.
          </p>
          <button className={styles.emptyAction}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Clear Filters
          </button>
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={handleClosePreview}
          onStartProject={handleStartProject}
        />
      )}

      {/* Template Rename Modal */}
      {renameModal && (
        <TemplateRenameModal
          isOpen={!!renameModal}
          onClose={handleCloseRenameModal}
          template={renameModal}
          onConfirm={handleConfirmRename}
        />
      )}
    </div>
  );
}
