"use client";

import React, { useState } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import PersonaSelectionModal from '../components/PersonaSelectionModal';
import { useAuth } from '../contexts/AuthContext';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import styles from './dashboard.module.css';

function DashboardLayoutInner({ children }) {
  const { user } = useAuth();
  const { hasCompletedPersonaSelection, setPersona, loading } = useOnboarding();
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  React.useEffect(() => {
    if (loading || hasCompletedPersonaSelection) return;
    setShowPersonaModal(true);
  }, [loading, hasCompletedPersonaSelection]);

  const handlePersonaSelect = async (persona) => {
    await setPersona(persona);
    setShowPersonaModal(false);
  };

  const handlePersonaSkip = async () => {
    await setPersona('exploring');
    setShowPersonaModal(false);
  };

  return (
    <div className={styles.dashboard}>
      <DashboardNavbar user={user} />
      <div className={styles.mainContent}>
        {children}
      </div>
      <PersonaSelectionModal
        open={showPersonaModal}
        onSelect={handlePersonaSelect}
        onSkip={handlePersonaSkip}
      />
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <OnboardingProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </OnboardingProvider>
  );
}
