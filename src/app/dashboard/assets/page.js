"use client";

import React, { useState } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopbar from "../../components/DashboardTopbar";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./assets.module.css";

export default function AssetsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={styles.assetsPage}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem="assets"
      />

      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={user}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>Asset Library – Browse & Upload</h1>
            <p className={styles.subtitle}>Discover props, characters, environments, materials, and templates</p>
          </header>

          <section className={styles.filters}>
            <div className={styles.searchRow}>
              <div className={styles.searchBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/></svg>
                <input placeholder="Search assets..." />
              </div>
              <button className={styles.uploadButton}>Upload Asset</button>
            </div>
            <div className={styles.filterRow}>
              <select className={styles.select}><option>All Categories</option><option>Props</option><option>Characters</option><option>Environments</option><option>Materials</option><option>Templates</option></select>
              <select className={styles.select}><option>All Tags</option><option>Platformer</option><option>RPG</option><option>FPS</option><option>Stylized</option><option>Realistic</option><option>Free</option><option>Paid</option></select>
              <select className={styles.select}><option>Sort by</option><option>Most Popular</option><option>Newest</option><option>Price (Low)</option><option>Price (High)</option></select>
            </div>
          </section>

          <section className={styles.gridSection}>
            <div className={styles.assetsGrid}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={styles.assetCard}>
                  <div className={styles.thumb}>
                    <div className={styles.thumbInner}></div>
                    <div className={styles.thumbOverlay}>
                      <button className={styles.previewBtn}>Preview</button>
                      <button className={styles.addBtn}>Add to Project</button>
                      <button className={styles.purchaseBtn}>Purchase</button>
                    </div>
                  </div>
                  <div className={styles.assetInfo}>
                    <div className={styles.assetTitle}>Asset #{i + 1}</div>
                    <div className={styles.assetMeta}>Props • by Creator</div>
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


