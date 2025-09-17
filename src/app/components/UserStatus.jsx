"use client";

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollaboration } from '../contexts/CollaborationContext';
import styles from './UserStatus.module.css';

export default function UserStatus() {
  const { user } = useAuth();
  const { activeUsers, connected } = useCollaboration();

  // Use demo user if no real user
  const currentUser = user || { username: 'Demo User' };

  return (
    <div className={styles.container}>
      <div className={styles.status}>
        <div className={`${styles.indicator} ${connected ? styles.connected : styles.disconnected}`} />
        <span className={styles.username}>{currentUser.username}</span>
      </div>
      
      {activeUsers.length > 0 && (
        <div className={styles.collaborators}>
          <div className={styles.label}>Collaborators:</div>
          <div className={styles.userList}>
            {activeUsers.map((collaborator, index) => (
              <div key={index} className={styles.collaborator}>
                <div className={styles.collaboratorIndicator} />
                <span>{collaborator.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
