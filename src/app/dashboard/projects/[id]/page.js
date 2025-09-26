"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardSidebar from "../../../components/DashboardSidebar";
import DashboardTopbar from "../../../components/DashboardTopbar";
import { useTheme } from "../../../contexts/ThemeContext";
import styles from "./project.module.css";

const cards = [
  { id: 'flow', label: 'Flow', href: '#flow' },
  { id: 'scenes', label: 'Scenes', href: '#scenes' },
  { id: 'maps', label: 'Maps', href: '#maps' },
  { id: 'assets', label: 'Asset Library', href: '#assets' },
  { id: 'characters', label: 'Characters', href: '#characters' },
  { id: 'script', label: 'Script', href: '#script' },
  { id: 'settings', label: 'Project Settings', href: '#settings' },
];

export default function ProjectDetailPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();
  const { theme, isDark } = useTheme();

  return (
    <div className={styles.projectPage}>
      <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeItem="projects" />
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar user={{ name: 'User' }} onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={styles.content}>
          <header className={styles.header}>
            <button 
              className={styles.backButton}
              onClick={() => router.push('/dashboard')}
              aria-label="Go back to dashboard"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Dashboard
            </button>
            <h1 className={styles.title}>Project Overview</h1>
            <p className={styles.subtitle}>Manage every part of your project</p>
          </header>

          <section className={styles.grid}>
            {cards.map((c) => (
              <a key={c.id} href={c.href} className={`${styles.card} ${isDark ? styles.cardDark : styles.cardLight}`}>
                <div className={styles.cardContent}>
                  <div className={styles.cardTitle}>{c.label}</div>
                  <div className={styles.cardAction}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </section>

          <section className={styles.analytics}>
            <h2>Analytics</h2>
            <div className={styles.analyticsGrid}>
              <div className={styles.metric}><div className={styles.metricLabel}>Scenes</div><div className={styles.metricValue}>12</div></div>
              <div className={styles.metric}><div className={styles.metricLabel}>Assets Used</div><div className={styles.metricValue}>57</div></div>
              <div className={styles.metric}><div className={styles.metricLabel}>Characters</div><div className={styles.metricValue}>8</div></div>
              <div className={styles.metric}><div className={styles.metricLabel}>Last Edited</div><div className={styles.metricValue}>2h ago</div></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


