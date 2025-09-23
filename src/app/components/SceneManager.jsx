"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
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

  // search & sort state
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');

  // toast state
  const [toasts, setToasts] = useState([]); // {id, text, variant}
  const toastTimeouts = useRef({});

  const pushToast = (text, variant = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { id, text, variant }]);
    // auto-dismiss
    const t = setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id));
    }, 2500);
    toastTimeouts.current[id] = t;
  };

  useEffect(() => () => {
    Object.values(toastTimeouts.current).forEach(clearTimeout);
  }, []);

  useEffect(() => {
    loadScenes();
  }, []);

  const loadScenes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scenes', { headers: commonHeaders });
      if (response.ok) {
        const data = await response.json();
        setScenes((data.scenes || []).sort((a,b) => new Date(b.updated_at||0) - new Date(a.updated_at||0)));
      }
    } catch (error) {
      console.error('Failed to load scenes:', error);
      pushToast('Failed to load scenes', 'error');
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
        headers: { 'Content-Type': 'application/json', ...commonHeaders },
        body: JSON.stringify({ name: newSceneName, objects: [], groups: [] }),
      });
      if (response.ok) {
        const data = await response.json();
        setScenes(prev => [data.scene, ...prev]);
        setNewSceneName('');
        setShowCreateForm(false);
        try {
          await fetch(`http://127.0.0.1:5000/scenes/${data.scene.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo_token' },
            body: JSON.stringify({ objects: [], groups: [] })
          });
        } catch (e) {
          console.warn('Collab backend upsert failed (create)', e);
        }
        joinScene(data.scene.id);
        onSceneCreate?.(data.scene);
        pushToast('Scene created', 'success');
      }
    } catch (error) {
      console.error('Failed to create scene:', error);
      pushToast('Create failed', 'error');
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
        try {
          await fetch(`http://127.0.0.1:5000/scenes/${sceneId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo_token' },
            body: JSON.stringify({ objects: data.scene.objects || [], groups: data.scene.groups || [] })
          });
        } catch (e) {
          console.warn('Collab backend upsert failed (load)', e);
        }
        joinScene(sceneId);
        onSceneLoad?.(data.scene);
        pushToast('Scene loaded', 'success');
      }
    } catch (error) {
      console.error('Failed to load scene:', error);
      pushToast('Load failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const leaveCurrentScene = () => {
    leaveScene();
    onSceneLoad?.(null);
    pushToast('Left scene', 'info');
  };

  // Rename support
  const [renameSceneId, setRenameSceneId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const startRename = (scene) => { setRenameSceneId(scene.id); setRenameValue(scene.name || 'Untitled Scene'); };
  const cancelRename = () => { setRenameSceneId(null); setRenameValue(''); };
  const commitRename = async (scene) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scenes/${scene.id}`);
      let latest = scene;
      if (res.ok) { const data = await res.json(); latest = data.scene || scene; }
      const put = await fetch(`/api/scenes/${scene.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameValue || 'Untitled Scene', objects: latest.objects || [], groups: latest.groups || [] })
      });
      if (put.ok) {
        const d = await put.json();
        setScenes(prev => prev.map(s => s.id === scene.id ? d.scene : s));
        if (currentSceneId === scene.id) { onSceneLoad?.(d.scene); }
        pushToast('Scene renamed', 'success');
      }
    } catch (e) {
      console.error('Rename failed', e);
      pushToast('Rename failed', 'error');
    } finally {
      setLoading(false);
      cancelRename();
    }
  };

  // Inline delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const requestDelete = (sceneId) => {
    setConfirmDeleteId(sceneId);
  };

  const performDelete = async (sceneId) => {
    try {
      const res = await fetch(`/api/scenes/${sceneId}`, { method: 'DELETE' });
      if (res.ok) {
        setScenes(prev => prev.filter(s => s.id !== sceneId));
        if (currentSceneId === sceneId) { leaveCurrentScene(); }
        pushToast('Scene deleted', 'success');
      } else {
        pushToast('Delete failed', 'error');
      }
    } catch (e) {
      console.error('Delete failed', e);
      pushToast('Delete failed', 'error');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const visibleScenes = useMemo(() => {
    const q = (query || '').toLowerCase();
    const filtered = (scenes || []).filter(s => !q || (s.name || '').toLowerCase().includes(q) || (s.id || '').toLowerCase().includes(q));
    const cmp = (a, b) => {
      if (sortKey === 'name') return (a.name || '').localeCompare(b.name || '');
      const av = new Date(a[sortKey] || 0).getTime();
      const bv = new Date(b[sortKey] || 0).getTime();
      return av - bv;
    };
    const sorted = [...filtered].sort(cmp);
    if (sortDir === 'desc') sorted.reverse();
    return sorted;
  }, [scenes, query, sortKey, sortDir]);

  return (
    <div className={styles.container}>
      {/* Animated gradient header */}
      <div className={styles.header}>
        <h3>Scenes</h3>
        <div className={styles.headerControls}>
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.input}
            style={{ marginBottom: 0, width: 140 }}
          />
          <select className={styles.input} value={sortKey} onChange={(e) => setSortKey(e.target.value)} style={{ marginBottom: 0, width: 140 }}>
            <option value="updated_at">Updated</option>
            <option value="created_at">Created</option>
            <option value="name">Name</option>
          </select>
          <button onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')} className={`${styles.sortToggle}`} title={`Sort ${sortDir === 'asc' ? 'Ascending' : 'Descending'}`}>
            {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </button>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={styles.createButton}
          >
            + New Scene
          </button>
        </div>
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
            <button onClick={createScene} disabled={loading || !newSceneName.trim()} className={styles.saveButton}>Create</button>
            <button onClick={() => setShowCreateForm(false)} className={styles.cancelButton}>Cancel</button>
          </div>
        </div>
      )}

      <div className={styles.sceneList}>
        {loading ? (
          <div className={styles.loading}>Loading scenes...</div>
        ) : visibleScenes.length === 0 ? (
          <div className={styles.empty}>No scenes found</div>
        ) : (
          visibleScenes.map(scene => (
            <div key={scene.id} className={`${styles.sceneItem} ${currentSceneId === scene.id ? styles.active : ''}`}>
              <div className={styles.sceneInfo}>
                {renameSceneId === scene.id ? (
                  <div className={styles.createForm}>
                    <input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className={styles.input} />
                    <div className={styles.formActions}>
                      <button onClick={() => commitRename(scene)} className={styles.saveButton}>Save</button>
                      <button onClick={cancelRename} className={styles.cancelButton}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.sceneName}>{scene.name || 'Untitled Scene'}</div>
                    <div className={styles.sceneMeta}>
                      {(scene.user_id ? `by ${scene.user_id} · ` : '')}
                      {scene.updated_at ? new Date(scene.updated_at).toLocaleString() : ''}
                    </div>
                  </>
                )}
              </div>
              <div className={styles.sceneActions}>
                {confirmDeleteId === scene.id ? (
                  <>
                    <button onClick={() => performDelete(scene.id)} className={styles.leaveButton}>Confirm</button>
                    <button onClick={() => setConfirmDeleteId(null)} className={styles.loadButton}>Cancel</button>
                  </>
                ) : (
                  <>
                    {renameSceneId !== scene.id && (
                      <button onClick={() => startRename(scene)} className={styles.loadButton}>Rename</button>
                    )}
                    <button 
                      onClick={() => currentSceneId === scene.id ? leaveCurrentScene() : loadScene(scene.id)}
                      className={currentSceneId === scene.id ? styles.leaveButton : styles.loadButton}
                    >
                      {currentSceneId === scene.id ? 'Leave' : 'Load'}
                    </button>
                    <button onClick={() => requestDelete(scene.id)} className={styles.leaveButton} title="Delete">Delete</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toasts */}
      <div className={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${t.variant === 'success' ? styles.toastSuccess : t.variant === 'error' ? styles.toastError : styles.toastInfo}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
