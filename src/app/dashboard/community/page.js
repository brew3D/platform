"use client";

import React, { useState } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import DashboardTopbar from "../../components/DashboardTopbar";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./community.module.css";

export default function CommunityPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const tabs = ['Posts','Tutorials','Creator Videos'];
  const [activeTab, setActiveTab] = useState('Posts');

  return (
    <div className={styles.communityPage}>
      <DashboardSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem="community"
      />

      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar 
          user={user}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>Community – Connect & Share</h1>
            <p className={styles.subtitle}>Posts, tutorials, and creator videos</p>
          </header>

          <div className={styles.tabs}>
            {tabs.map(t => (
              <button key={t} className={`${styles.tab} ${activeTab===t?styles.active:''}`} onClick={()=>setActiveTab(t)}>{t}</button>
            ))}
          </div>

          <section className={styles.feed}>
            {activeTab === 'Posts' && (
              <div className={styles.postGrid}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={styles.postCard}>
                    <div className={styles.postHeader}>
                      <div className={styles.avatar}>U</div>
                      <div className={styles.postMeta}>
                        <div className={styles.author}>User {i+1}</div>
                        <div className={styles.time}>Just now</div>
                      </div>
                    </div>
                    <div className={styles.postContent}>Here is a tip for building better maps in RuchiAI...</div>
                    <div className={styles.postActions}>
                      <button>Like</button><button>Comment</button><button>Share</button><button>Bookmark</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'Tutorials' && (
              <div className={styles.placeholder}>Curated tutorials will appear here.</div>
            )}
            {activeTab === 'Creator Videos' && (
              <div className={styles.placeholder}>YouTube playlists from verified creators.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}


