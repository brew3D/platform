"use client";

import React, { useState } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopbar from "../../components/DashboardTopbar";
import { useAuth } from "../../contexts/AuthContext";
import ProfileTab from "./components/ProfileTab";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (authLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className={styles.error}>Please log in to view your profile.</div>;
  }

  return (
    <div className={styles.profilePage}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem="profile"
      />

      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={user}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>Profile</h1>
            <p className={styles.subtitle}>Manage your account, billing, and preferences</p>
          </header>

          <div className={styles.profileContainer}>
            <ProfileTab user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
