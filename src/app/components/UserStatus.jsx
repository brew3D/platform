"use client";

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCollaboration } from '../contexts/CollaborationContext';
import styles from './UserStatus.module.css';

export default function UserStatus({ compact = false }) {
  const { user } = useAuth();
  const { activeUsers, connected, debugLocalStorage } = useCollaboration();

  const currentUser = user || { username: 'Demo User', name: 'Demo User' };
  
  // Debug logging
  console.log('🔍 UserStatus - activeUsers:', activeUsers);
  console.log('🔍 UserStatus - connected:', connected);
  console.log('🔍 UserStatus - currentUser:', currentUser);

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
    // Only show online users, filter out offline users
    const onlineUsers = activeUsers && activeUsers.length > 0 ? activeUsers.filter(u => u.online !== false) : [];
    
    // If no online users and we're connected, show current user
    const list = onlineUsers.length > 0 ? onlineUsers : (connected ? [{ 
      username: currentUser.username || currentUser.name, 
      user_id: currentUser.userId || 'current_user', 
      name: currentUser.name || currentUser.username,
      online: true
    }] : []);
    
    return (
      <div className={styles.avatarsRow} title={connected ? 'Online Users' : 'Disconnected'}>
        {list.map((u, idx) => {
          const initial = getInitial(u.name, u.username);
          const bg = colorFor(u.user_id || u.username || String(idx));
          return (
            <div key={(u.user_id || u.username || idx) + String(idx)} className={styles.avatar} style={{ background: bg }} title={`${u.name || u.username} (Online)`}>
              <span className={styles.avatarText}>{initial}</span>
              <div className={styles.onlineIndicator}></div>
            </div>
          );
        })}
        {/* Debug button */}
        <button 
          onClick={() => {
            debugLocalStorage();
            console.log('🔍 Manual debug - activeUsers:', activeUsers);
            console.log('🔍 Manual debug - onlineUsers:', onlineUsers);
            console.log('🔍 Manual debug - list:', list);
          }}
          style={{
            background: '#8b5a2b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            marginLeft: '8px'
          }}
          title="Debug collaboration"
        >
          Debug
        </button>
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
