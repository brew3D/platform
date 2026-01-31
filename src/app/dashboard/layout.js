"use client";

import React, { useState } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import DashboardSidebar from '../components/DashboardSidebar';
import PersonaSelectionModal from '../components/PersonaSelectionModal';
import { useAuth } from '../contexts/AuthContext';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import { usePathname } from 'next/navigation';
import styles from './dashboard.module.css';

function DashboardLayoutInner({ children }) {
  const { user } = useAuth();
  const pathname = usePathname();
  // Show full dashboard sidebar for non-project dashboard routes
  const showDashboardSidebar = pathname && pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/projects/');
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
      {showDashboardSidebar && (
        <DashboardSidebar />
      )}
      <div className={`${styles.mainContent} ${showDashboardSidebar ? styles.withSidebar : ''}`}>
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
