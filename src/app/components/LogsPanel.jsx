"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollaboration } from '../contexts/CollaborationContext';
import styles from './LogsPanel.module.css';

export default function LogsPanel({ isOpen, onClose }) {
  const { user } = useAuth();
  const { currentSceneId } = useCollaboration();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch logs from the backend
  const fetchLogs = async () => {
    if (!currentSceneId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/collaboration/logs?sceneId=${currentSceneId}`);
      if (response.ok) {
        const data = await response.json();
        const logs = data.logs || [];
        
        // Deduplicate logs based on a unique key (timestamp + userId + action + details)
        const uniqueLogs = logs.reduce((acc, log) => {
          const logKey = `${log.timestamp}_${log.userId}_${log.action}_${log.details || ''}`;
          if (!acc.find(existing => {
            const existingKey = `${existing.timestamp}_${existing.userId}_${existing.action}_${existing.details || ''}`;
            return existingKey === logKey;
          })) {
            acc.push(log);
          }
          return acc;
        }, []);
        
        console.log(`📝 LogsPanel: Fetched ${logs.length} logs, deduplicated to ${uniqueLogs.length}`);
        setLogs(uniqueLogs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for new logs every 2 seconds
  useEffect(() => {
    if (!isOpen || !currentSceneId) return;

    fetchLogs(); // Initial fetch
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [isOpen, currentSceneId]);

  // Add a new log entry
  const addLog = (action, details = '') => {
    const newLog = {
      id: Date.now(),
      userId: user?.userId,
      userName: user?.name || user?.username || 'Unknown User',
      action,
      details,
      timestamp: new Date().toISOString()
    };

    setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep only last 50 logs

    // Send to backend
    fetch('/api/collaboration/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sceneId: currentSceneId,
        ...newLog
      })
    }).catch(error => console.error('Error sending log:', error));
  };

  // Expose addLog function globally for other components to use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addCollaborationLog = addLog;
    }
  }, [currentSceneId, user?.userId, user?.name, user?.username]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Activity Logs</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className={styles.empty}>No activity yet</div>
          ) : (
            <div className={styles.logsList}>
              {logs.map((log, index) => (
                <div key={`${log.timestamp}_${log.userId}_${log.action}_${log.details || ''}_${index}`} className={styles.logItem}>
                  <div className={styles.logHeader}>
                    <span className={styles.userName}>{log.userName}</span>
                    <span className={styles.timestamp}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={styles.logAction}>
                    {log.action} {log.details && <span className={styles.details}>({log.details})</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
