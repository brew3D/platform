"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";
import ProjectSidebar from "../../../components/ProjectSidebar";
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
  { id: 'carve', label: 'Builder' },
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
      // Redirect to settings by default when project is opened
      const currentPath = window.location.pathname;
      if (currentPath === `/dashboard/projects/${projectId}`) {
        router.replace(`/dashboard/projects/${projectId}/settings`);
      }
    }
  }, [projectId, router]);

  const handleCardClick = (card) => {
    if (card.id === 'collab') {
      // Navigate directly to editor for collab room
      router.push(`/editor?project=${projectId}`);
    } else if (card.id === 'carve') {
      // Navigate to builder page for Builder card
      router.push('/builder');
    } else {
      router.push(`/dashboard/projects/${projectId}/${card.id}`);
    }
  };

  // Redirect to settings page - this component should rarely render
  useEffect(() => {
    if (projectId && !loading) {
      router.replace(`/dashboard/projects/${projectId}/settings`);
    }
  }, [projectId, loading, router]);

  if (loading) {
    return (
      <div className={styles.projectPage}>
        <div className={styles.loading}>Loading project...</div>
      </div>
    );
  }

  // This page will redirect to settings, but show a loading state just in case
  return (
    <div className={styles.projectPage}>
      <div className={styles.loading}>Redirecting to project settings...</div>
    </div>
  );
}


