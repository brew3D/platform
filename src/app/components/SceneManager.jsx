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
  const { user } = useAuth();
  const userId = user?.id || 'demo_user';
  const commonHeaders = { 'x-user-id': userId };

  useEffect(() => {
    // Always load scenes for demo
    loadScenes();
  }, []);

  const loadScenes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scenes', {
        headers: commonHeaders,
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
          ...commonHeaders,
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
        // Upsert to collaboration backend so a room exists
        try {
          await fetch(`http://localhost:5000/scenes/${data.scene.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo_token' },
            body: JSON.stringify({ objects: [], groups: [] })
          });
        } catch (e) {
          console.warn('Collab backend upsert failed (create)', e);
        }
        joinScene(data.scene.id);
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
        // Ensure collab backend has an up-to-date copy
        try {
          await fetch(`http://localhost:5000/scenes/${sceneId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo_token' },
            body: JSON.stringify({ objects: data.scene.objects || [], groups: data.scene.groups || [] })
          });
        } catch (e) {
          console.warn('Collab backend upsert failed (load)', e);
        }
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

  // Rename support
  const [renameSceneId, setRenameSceneId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const startRename = (scene) => {
    setRenameSceneId(scene.id);
    setRenameValue(scene.name || 'Untitled Scene');
  };

  const cancelRename = () => {
    setRenameSceneId(null);
    setRenameValue('');
  };

  const commitRename = async (scene) => {
    setLoading(true);
    try {
      // Ensure we have latest objects/groups before renaming
      const res = await fetch(`/api/scenes/${scene.id}`);
      let latest = scene;
      if (res.ok) {
        const data = await res.json();
        latest = data.scene || scene;
      }
      const put = await fetch(`/api/scenes/${scene.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: renameValue || 'Untitled Scene',
          objects: latest.objects || [],
          groups: latest.groups || [],
        })
      });
      if (put.ok) {
        const d = await put.json();
        setScenes(prev => prev.map(s => s.id === scene.id ? d.scene : s));
        if (currentSceneId === scene.id) {
          onSceneLoad?.(d.scene);
        }
      }
    } catch (e) {
      console.error('Rename failed', e);
    } finally {
      setLoading(false);
      cancelRename();
    }
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
                {renameSceneId === scene.id ? (
                  <div className={styles.createForm}>
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className={styles.input}
                    />
                    <div className={styles.formActions}>
                      <button onClick={() => commitRename(scene)} className={styles.saveButton}>Save</button>
                      <button onClick={cancelRename} className={styles.cancelButton}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.sceneName}>{scene.name}</div>
                    <div className={styles.sceneMeta}>
                      {scene.user_id ? `by ${scene.user_id} · ` : ''}
                      {scene.updated_at ? new Date(scene.updated_at).toLocaleString() : ''}
                    </div>
                  </>
                )}
              </div>
              <div className={styles.sceneActions}>
                {renameSceneId !== scene.id && (
                  <button onClick={() => startRename(scene)} className={styles.loadButton}>Rename</button>
                )}
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
