"use client";

import React, { useState, useEffect } from "react";
import styles from "./TemplateRenameModal.module.css";

export default function TemplateRenameModal({ 
  isOpen, 
  onClose, 
  template, 
  onConfirm 
}) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  useEffect(() => {
    if (isOpen && template) {
      setProjectName(template.name);
      setProjectDescription(template.description || "");
    }
  }, [isOpen, template]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (projectName.trim()) {
      onConfirm({
        name: projectName.trim(),
        description: projectDescription.trim(),
        template: template
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Start New Project</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.templateInfo}>
            <div className={styles.templateIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className={styles.templateDetails}>
              <h3 className={styles.templateName}>Based on: {template?.name}</h3>
              <p className={styles.templateDescription}>{template?.description}</p>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Project Name *
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.input}
              placeholder="Enter your project name"
              autoFocus
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Description (Optional)
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.textarea}
              placeholder="Describe your project..."
              rows={3}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.confirmButton}
              disabled={!projectName.trim()}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
