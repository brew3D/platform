"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./project.module.css";

const cards = [
  { id: 'flow', label: 'Flow ( Script )' },
  { id: 'script', label: 'Script' },
  { id: 'scenes', label: 'Animated Scenes' },
  { id: 'maps', label: 'Maps' },
  { id: 'assets', label: 'Asset Library' },
  { id: 'characters', label: 'Characters' },
  { id: 'settings', label: 'Project Settings' },
  { id: 'collab', label: 'Collab Room', isSpecial: true },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleCardClick = (card) => {
    if (card.id === 'collab') {
      // Navigate directly to editor for collab room
      router.push(`/editor?project=${projectId}`);
    } else {
      router.push(`/dashboard/projects/${projectId}/${card.id}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.projectPage}>
        <div className={styles.loading}>Loading project...</div>
      </div>
    );
  }

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
            <div className={styles.headerContent}>
              <div>
                <h1 className={styles.title}>{project?.name || 'Project Overview'}</h1>
                <p className={styles.subtitle}>Manage every part of your project</p>
              </div>
              <div className={styles.projectInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Team:</span>
                  <span className={styles.infoValue}>{project?.teamName || 'Personal'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Created:</span>
                  <span className={styles.infoValue}>
                    {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Status:</span>
                  <span className={`${styles.infoValue} ${styles.statusActive}`}>
                    {project?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <section className={styles.grid}>
            {cards.map((c) => (
              <button
                key={c.id}
                className={`${styles.card} ${isDark ? styles.cardDark : styles.cardLight} ${c.isSpecial ? styles.specialCard : ''}`}
                onClick={() => handleCardClick(c)}
                aria-label={`Open ${c.label}`}
              >
                <div className={styles.cardContent}>
                  <div className={styles.cardTitle}>
                    {c.label}
                    {c.isSpecial && <span className={styles.specialBadge}>Live</span>}
                  </div>
                  <div className={styles.cardAction}>
                    {c.isSpecial ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5V13L12 9L16 13V5H8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
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


