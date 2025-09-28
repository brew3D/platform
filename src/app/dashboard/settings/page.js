"use client";

import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopbar from "../../components/DashboardTopbar";
import PreferencesTab from "../profile/components/PreferencesTab";
import styles from "./settings.module.css";

export default function SettingsPage() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={styles.settingsPage}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem="preferences"
      />
      
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={user}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className={styles.content}>
          <div className={styles.header}>
            <h1 className={styles.title}>Preferences</h1>
            <p className={styles.subtitle}>Manage your account preferences and settings</p>
          </div>

          <div className={styles.settingsContainer}>
            <PreferencesTab user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}