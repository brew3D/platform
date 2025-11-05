"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./scenes.module.css";

function storageKey(projectId) {
  return `brew3d:project:${projectId}:scenes`;
}

function readScenes(projectId) {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeScenes(projectId, scenes) {
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(scenes));
  } catch {}
}

export default function ProjectScenesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [scenes, setScenes] = useState([]);

  useEffect(() => {
    setScenes(readScenes(id));
  }, [id]);

  const createScene = () => {
    const newScene = {
      id: crypto.randomUUID(),
      name: `Scene ${scenes.length + 1}`,
      createdAt: Date.now(),
      lastModified: Date.now(),
      objects: [],
      camera: { position: [0, 5, 10], target: [0, 0, 0] },
      lighting: { ambient: 0.4, directional: 0.8 }
    };
    const updated = [...scenes, newScene];
    setScenes(updated);
    writeScenes(id, updated);
  };

  const openScene = (sceneId) => {
    router.push(`/dashboard/projects/${id}/scenes/${sceneId}`);
  };

  const deleteScene = (sceneId) => {
    const updated = scenes.filter(s => s.id !== sceneId);
    setScenes(updated);
    writeScenes(id, updated);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/dashboard/projects/${id}`)}>
          ← Back
        </button>
        <h1 className={styles.title}>Animated Scenes</h1>
        <p className={styles.subtitle}>Create and manage your animated scenes.</p>
      </header>

      <section className={styles.actionsBar}>
        <button className={styles.createButton} onClick={createScene}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Create New Scene
        </button>
        <div className={styles.stats}>
          <span>{scenes.length} scenes</span>
        </div>
      </section>

      <section className={styles.scenesGrid}>
        {scenes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3>No scenes yet</h3>
            <p>Create your first animated scene to get started</p>
            <button className={styles.createButton} onClick={createScene}>
              Create Scene
            </button>
          </div>
        ) : (
          scenes.map((scene) => (
            <div key={scene.id} className={styles.sceneCard}>
              <div className={styles.scenePreview}>
                <div className={styles.previewPlaceholder}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className={styles.sceneActions}>
                  <button 
                    className={styles.actionButton}
                    onClick={() => openScene(scene.id)}
                    title="Open Scene"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button 
                    className={styles.actionButton}
                    onClick={() => deleteScene(scene.id)}
                    title="Delete Scene"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className={styles.sceneInfo}>
                <h3 className={styles.sceneName}>{scene.name}</h3>
                <p className={styles.sceneMeta}>
                  {scene.objects.length} objects • {new Date(scene.lastModified).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}


