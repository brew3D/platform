"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "../../../contexts/ThemeContext";
import styles from "./project.module.css";

const cards = [
  { id: 'flow', label: 'Flow ( Script )' },
  { id: 'scenes', label: 'Animated Scenes' },
  { id: 'maps', label: 'Maps' },
  { id: 'assets', label: 'Asset Library' },
  { id: 'characters', label: 'Characters' },
  { id: 'settings', label: 'Project Settings' },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();
  const { theme, isDark } = useTheme();

  return (
    <div className={styles.projectPage}>
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
              <button
                key={c.id}
                className={`${styles.card} ${isDark ? styles.cardDark : styles.cardLight}`}
                onClick={() => router.push(`/dashboard/projects/${projectId}/${c.id}`)}
                aria-label={`Open ${c.label}`}
              >
                <div className={styles.cardContent}>
                  <div className={styles.cardTitle}>{c.label}</div>
                  <div className={styles.cardAction}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </button>
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
  );
}


