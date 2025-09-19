"use client";

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollaboration } from '../contexts/CollaborationContext';
import styles from './UserStatus.module.css';

export default function UserStatus({ compact = false }) {
  const { user } = useAuth();
  const { activeUsers, connected } = useCollaboration();

  const currentUser = user || { username: 'Demo User', name: 'Demo User' };

  const getInitial = (name, username) => {
    const source = name || username || 'Demo User';
    const c = String(source).trim().charAt(0).toUpperCase();
    return c || 'D';
  };

  const colorFor = (key) => {
    const str = key || 'demo';
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    const hue = hash % 360;
    return `hsl(${hue}, 60%, 40%)`;
  };

  if (compact) {
    const list = activeUsers && activeUsers.length > 0 ? activeUsers : [{ username: currentUser.username, user_id: 'demo_user', name: currentUser.name }];
    return (
      <div className={styles.avatarsRow} title={connected ? 'Connected' : 'Disconnected'}>
        {list.map((u, idx) => {
          const initial = getInitial(u.name, u.username);
          const bg = colorFor(u.user_id || u.username || String(idx));
          return (
            <div key={(u.user_id || u.username || idx) + String(idx)} className={styles.avatar} style={{ background: bg }} title={u.name || u.username}>
              <span className={styles.avatarText}>{initial}</span>
            </div>
          );
        })}
      </div>
    );
  }

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
