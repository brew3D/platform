'use client';

import React, { useState } from 'react';
import { useOnboarding } from '@/app/contexts/OnboardingContext';
import styles from './OnboardingNextStep.module.css';

export default function OnboardingNextStep({ onCreateProject, hasProjects }) {
  const { nextStep, markStepDone } = useOnboarding();
  const [dismissed, setDismissed] = useState(false);

  if (!nextStep || dismissed || hasProjects) return null;

  const handleAction = () => {
    if (nextStep.id === 'create_project' && typeof onCreateProject === 'function') {
      onCreateProject();
    } else if (nextStep.id === 'land_flow' || nextStep.id === 'open_flow') {
      markStepDone(nextStep.id);
      // Could navigate to a project's flow if we had projectId in context
    } else {
      markStepDone(nextStep.id);
    }
  };

  const actionLabel = nextStep.id === 'create_project' ? 'Create project' : nextStep.action;

  return (
    <div className={styles.banner} role="status">
      <p className={styles.copy}>
        <strong>Next:</strong> {nextStep.copy}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button type="button" className={styles.action} onClick={handleAction}>
          {actionLabel}
        </button>
        <button
          type="button"
          className={styles.dismiss}
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
