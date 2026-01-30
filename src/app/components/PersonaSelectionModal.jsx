'use client';

import React, { useState } from 'react';
import { PERSONA_OPTIONS } from '@/app/lib/onboarding-config';
import styles from './PersonaSelectionModal.module.css';

export default function PersonaSelectionModal({ open, onSelect, onSkip }) {
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await onSelect(selected);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="persona-modal-title">
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 id="persona-modal-title" className={styles.title}>How are you using Brew3D?</h2>
          <p className={styles.subtitle}>
            We’ll tailor your first steps so you get to value in under 10 minutes. You can change this later.
          </p>
        </div>
        <div className={styles.body}>
          {PERSONA_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              className={`${styles.option} ${selected === opt.id ? styles.selected : ''}`}
              onClick={() => setSelected(opt.id)}
            >
              <span className={styles.icon} aria-hidden>{opt.icon}</span>
              <div className={styles.content}>
                <div className={styles.optionTitle}>{opt.label}</div>
                <p className={styles.optionDesc}>{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.skipLink} onClick={onSkip}>
            Just exploring for now
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleConfirm}
            disabled={!selected || submitting}
          >
            {submitting ? 'Setting up…' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
