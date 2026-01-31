'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import BaristaBoard from '../../../../components/BaristaBoard';
import styles from './board.module.css';

export default function ProjectBoardPage() {
  const params = useParams();
  const projectId = params?.id;
  const { authenticatedFetch } = useAuth();
  const [boardId, setBoardId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBoard();
  }, [projectId]);

  const loadBoard = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/barista/boards?projectId=${projectId}`);
      if (res.ok) {
        const boards = await res.json();
        if (boards.length > 0) {
          setBoardId(boards[0].board_id);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.code === 'TABLE_NOT_FOUND' || 
            errorData.error?.includes('relation') || 
            errorData.error?.includes('does not exist')) {
          setError({ type: 'TABLE_NOT_FOUND', ...errorData });
        } else {
          setError(errorData);
        }
      }
    } catch (error) {
      console.error('Error loading board:', error);
      setError({ error: error.message || 'Unknown error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    try {
      setCreating(true);
      setError(null);
      const createRes = await authenticatedFetch('/api/barista/boards', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          name: 'Barista Board',
          description: 'Coffee-themed Kanban board for game development'
        })
      });
      
      if (createRes.ok) {
        const board = await createRes.json();
        setBoardId(board.board_id);
      } else {
        const errorData = await createRes.json().catch(() => ({}));
        console.error('Create board error:', errorData);
        setError(errorData);
      }
    } catch (error) {
      console.error('Error creating board:', error);
      setError({ error: error.message || 'Failed to create board' });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>☕ Loading your café...</div>;
  }

  // Show welcome screen if no board exists
  if (!boardId && !loading) {
    const isTableNotFound = error?.type === 'TABLE_NOT_FOUND' || 
                            error?.code === 'TABLE_NOT_FOUND' ||
                            error?.error?.includes('relation') || 
                            error?.error?.includes('does not exist');
    
    if (isTableNotFound) {
      return (
        <div className={styles.error}>
          <h2>☕ Barista Board Setup Required</h2>
          <p><strong>Database tables not found.</strong></p>
          <p>To use the Barista Board, you need to run the SQL migration:</p>
          <ol style={{ textAlign: 'left', display: 'inline-block', marginTop: '1rem' }}>
            <li>Open your Supabase dashboard</li>
            <li>Go to SQL Editor</li>
            <li>Copy the contents of <code>src/app/lib/barista-board-schema.sql</code></li>
            <li>Run the SQL migration</li>
          </ol>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
            The migration creates all necessary tables for boards, cards, comments, and activity logging.
          </p>
        </div>
      );
    }

    // Welcome screen - no board created yet
    return (
      <div className={styles.welcome}>
        <div className={styles.welcomeContent}>
          <div className={styles.welcomeIcon}>☕</div>
          <h1>Welcome to Barista Board</h1>
          <p className={styles.welcomeDescription}>
            A coffee-themed Kanban board designed specifically for game studios.
            Organize your tasks, track progress, and collaborate with your team.
          </p>
          
          <div className={styles.freeBadge}>
            <span className={styles.badgeIcon}>🎁</span>
            <span><strong>Free & Complimentary</strong> - No charges, no limits</span>
          </div>

          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🎯</span>
              <div>
                <h3>Game-Specific Fields</h3>
                <p>Link builds, track engine context, and manage assets</p>
              </div>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>💬</span>
              <div>
                <h3>3D-Ready Comments</h3>
                <p>Comments ready for future 3D Testbox integration</p>
              </div>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📊</span>
              <div>
                <h3>Full Activity Log</h3>
                <p>Complete audit trail of all board changes</p>
              </div>
            </div>
          </div>

          <button
            className={styles.createButton}
            onClick={handleCreateBoard}
            disabled={creating}
          >
            {creating ? '☕ Creating your café...' : '☕ Create Barista Board'}
          </button>

          {error && !isTableNotFound && (
            <div className={styles.errorMessage}>
              <p><strong>Error:</strong> {error.error || error.message || 'Failed to create board'}</p>
              {error.details && (
                <details style={{ marginTop: '0.5rem', textAlign: 'left' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Details</summary>
                  <pre style={{ background: '#FEF2F2', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    {JSON.stringify(error, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <BaristaBoard boardId={boardId} projectId={projectId} />;
}
