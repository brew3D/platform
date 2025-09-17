"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollaboration } from '../contexts/CollaborationContext';
import styles from './SceneManager.module.css';

export default function SceneManager({ onSceneLoad, onSceneCreate }) {
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const { token } = useAuth();
  const { joinScene, leaveScene, currentSceneId } = useCollaboration();

  useEffect(() => {
    // Always load scenes for demo
    loadScenes();
  }, []);

  const loadScenes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scenes', {
        headers: {
          'x-user-id': 'demo_user',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setScenes(data.scenes || []);
      }
    } catch (error) {
      console.error('Failed to load scenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createScene = async () => {
    if (!newSceneName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/scenes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo_user',
        },
        body: JSON.stringify({
          name: newSceneName,
          objects: [],
          groups: []
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setScenes(prev => [...prev, data.scene]);
        setNewSceneName('');
        setShowCreateForm(false);
        onSceneCreate?.(data.scene);
      }
    } catch (error) {
      console.error('Failed to create scene:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScene = async (sceneId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/scenes/${sceneId}`);

      if (response.ok) {
        const data = await response.json();
        joinScene(sceneId);
        onSceneLoad?.(data.scene);
      }
    } catch (error) {
      console.error('Failed to load scene:', error);
    } finally {
      setLoading(false);
    }
  };

  const leaveCurrentScene = () => {
    leaveScene();
    onSceneLoad?.(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Scenes</h3>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={styles.createButton}
        >
          + New Scene
        </button>
      </div>

      {showCreateForm && (
        <div className={styles.createForm}>
          <input
            type="text"
            placeholder="Scene name"
            value={newSceneName}
            onChange={(e) => setNewSceneName(e.target.value)}
            className={styles.input}
          />
          <div className={styles.formActions}>
            <button 
              onClick={createScene}
              disabled={loading || !newSceneName.trim()}
              className={styles.saveButton}
            >
              Create
            </button>
            <button 
              onClick={() => setShowCreateForm(false)}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles.sceneList}>
        {loading ? (
          <div className={styles.loading}>Loading scenes...</div>
        ) : scenes.length === 0 ? (
          <div className={styles.empty}>No scenes found</div>
        ) : (
          scenes.map(scene => (
            <div 
              key={scene.id} 
              className={`${styles.sceneItem} ${currentSceneId === scene.id ? styles.active : ''}`}
            >
              <div className={styles.sceneInfo}>
                <div className={styles.sceneName}>{scene.name}</div>
                <div className={styles.sceneMeta}>
                  {new Date(scene.updated_at).toLocaleDateString()}
                </div>
              </div>
              <div className={styles.sceneActions}>
                {currentSceneId === scene.id ? (
                  <button 
                    onClick={leaveCurrentScene}
                    className={styles.leaveButton}
                  >
                    Leave
                  </button>
                ) : (
                  <button 
                    onClick={() => loadScene(scene.id)}
                    className={styles.loadButton}
                  >
                    Load
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
