"use client";

import React, { useState } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopbar from "../../components/DashboardTopbar";
import styles from "./tutorials.module.css";

export default function TutorialsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={styles.tutorialsPage}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem="tutorials"
      />

      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={{ name: 'User' }}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>Tutorials – Learn & Master RuchiAI</h1>
            <p className={styles.subtitle}>From basics to advanced workflows</p>
          </header>

          <section className={styles.filters}>
            <div className={styles.searchRow}>
              <div className={styles.searchBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/></svg>
                <input placeholder="Search tutorials..." />
              </div>
              <select className={styles.select}><option>Sort: Recommended</option><option>Most Viewed</option><option>Newest</option></select>
            </div>
            <div className={styles.filterRow}>
              <select className={styles.select}><option>Basics</option><option>Editor</option><option>Assets</option><option>Maps</option><option>Scripts</option></select>
              <select className={styles.select}><option>Advanced</option><option>AI-assist</option><option>Collaboration</option><option>Cloud Publishing</option></select>
              <select className={styles.select}><option>Community</option><option>Creator Tutorials</option><option>Playlists</option></select>
            </div>
          </section>

          <section className={styles.gridSection}>
            <div className={styles.videoGrid}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={styles.videoCard}>
                  <div className={styles.thumb}>
                    <div className={styles.playIcon}>▶</div>
                  </div>
                  <div className={styles.videoInfo}>
                    <div className={styles.videoTitle}>Tutorial #{i + 1} – Getting Started</div>
                    <div className={styles.videoMeta}>10:0{i} • by Creator</div>
                  </div>
                  <div className={styles.videoHover}>
                    <div className={styles.videoDesc}>Learn the essentials to start building with RuchiAI.</div>
                    <button className={styles.watchBtn}>Watch</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


