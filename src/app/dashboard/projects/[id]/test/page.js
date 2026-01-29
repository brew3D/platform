"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectSidebar from '@/app/components/ProjectSidebar';
import styles from './test.module.css';

export default function TestGamePage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewStatus, setPreviewStatus] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  const handlePlay = async () => {
    if (!id || !project) return;

    setIsPlaying(true);
    setError(null);
    setPreviewStatus('queued');

    try {
      const res = await fetch(`/api/projects/${id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engineType: project.engineType || 'unreal',
          branchOrSha: project.defaultBranch || 'main',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPreviewStatus(data.status || 'completed');
        setStreamUrl(data.streamUrl || data.stream_url);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || 'Failed to start preview');
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Error starting preview:', err);
      setError('Failed to start preview');
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setPreviewStatus(null);
    setStreamUrl(null);
    setError(null);
  };

  const engineType = project?.engineType || 'unreal';
  const repoUrl = project?.repoUrl || 'Not linked';
  const defaultBranch = project?.defaultBranch || 'main';

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <ProjectSidebar projectId={id} />
          <main style={{ flex: 1 }}>
            <div className={styles.loading}>Loading project...</div>
          </main>
        </div>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <ProjectSidebar projectId={id} />
          <main style={{ flex: 1 }}>
            <button
              className={styles.backButton}
              onClick={() => router.push(`/dashboard/projects/${id}/hub`)}
              style={{ marginBottom: '1rem' }}
            >
              ← Back to Hub
            </button>

            <h1 className={styles.title}>Engine Preview</h1>
            <p className={styles.subtitle}>
              Run your {engineType.toUpperCase()} project in the cloud and stream it to your browser.
            </p>

            <div className={styles.playContainer}>
              <div className={styles.playBox}>
                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Engine: <strong>{engineType.toUpperCase()}</strong>
                  </p>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Repo: <strong>{repoUrl}</strong>
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Branch: <strong>{defaultBranch}</strong>
                  </p>
                </div>

                <button className={styles.playButton} onClick={handlePlay}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>
                <p className={styles.playLabel}>Start Engine Preview</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
                  This will run your actual engine project in a cloud VM and stream the output.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <ProjectSidebar projectId={id} />
        <main style={{ flex: 1 }}>
          <div className={styles.gameHeader}>
            <button className={styles.stopButton} onClick={handleStop}>
              Stop Preview
            </button>
            <h2 className={styles.gameTitle}>
              Engine Preview - {engineType.toUpperCase()}
            </h2>
          </div>

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          {previewStatus === 'queued' && (
            <div className={styles.loading}>
              <p>Preview request queued...</p>
            </div>
          )}

          {previewStatus === 'running' && (
            <div className={styles.loading}>
              <p>Starting engine instance...</p>
            </div>
          )}

          {previewStatus === 'completed' && streamUrl && (
            <div className={styles.gameContainer}>
              <div className={styles.mapViewer}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--card-background)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 12,
                  padding: '2rem',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                      Engine Preview Stream
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Stream URL: <code style={{ background: 'var(--card-background)', padding: '0.25rem 0.5rem', borderRadius: 4 }}>{streamUrl}</code>
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      This is a placeholder. Real engine preview will stream video + input from a cloud VM running your {engineType.toUpperCase()} project.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewStatus === 'failed' && (
            <div className={styles.error}>
              <p>Preview failed. Please try again.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
