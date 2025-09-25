"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardSidebar from "../../../components/DashboardSidebar";
import DashboardTopbar from "../../../components/DashboardTopbar";
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

  return (
    <div className={styles.projectPage}>
      <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeItem="projects" />
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DashboardTopbar user={{ name: 'User' }} onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>Project Overview</h1>
            <p className={styles.subtitle}>Manage every part of your project</p>
          </header>

          <section className={styles.grid}>
            {cards.map((c) => (
              <a key={c.id} href={c.href} className={styles.card}>
                <div className={styles.cardTitle}>{c.label}</div>
                <div className={styles.cardAction}>Open →</div>
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


