"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const CollaborationContext = createContext();

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

export const CollaborationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentSceneId, setCurrentSceneId] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    // Always connect for demo - use demo token if no real token
    const authToken = token || 'demo_token';
    
    const newSocket = io('http://127.0.0.1:5000', {
      transports: ['polling'] // dev: avoid WS retry spam under Werkzeug; enables stable long-polling
    });

    newSocket.on('connect', () => {
      console.log('Connected to collaboration server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      setConnected(false);
    });

    // Silence noisy generic errors; opt-in debug via localStorage.DEBUG_SOCKET = '1'
    const shouldLog = () => {
      try { return typeof window !== 'undefined' && window.localStorage?.getItem('DEBUG_SOCKET') === '1'; } catch { return false; }
    };

    newSocket.on('connect_error', (err) => {
      if (shouldLog()) console.warn('Socket connect_error:', err?.message || err);
    });
    newSocket.io?.on?.('reconnect_error', (err) => {
      if (shouldLog()) console.warn('Socket reconnect_error:', err?.message || err);
    });
    // Do not log the plain 'error' event by default to avoid empty-object spam

    newSocket.on('user_joined', (data) => {
      setActiveUsers(prev => [...prev, data]);
    });

    newSocket.on('user_left', (data) => {
      setActiveUsers(prev => prev.filter(user => user.user_id !== data.user_id));
    });

    newSocket.on('active_users', (data) => {
      setActiveUsers(data.users);
    });

    // Editor listens directly; these logs are noisy in prod

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  const joinScene = (sceneId) => {
    if (socket) {
      const authToken = token || 'demo_token';
      socket.emit('join_scene', { token: authToken, scene_id: sceneId });
      setCurrentSceneId(sceneId);
    }
  };

  const leaveScene = () => {
    if (socket && currentSceneId) {
      socket.emit('leave_scene', { scene_id: currentSceneId });
      setCurrentSceneId(null);
      setActiveUsers([]);
    }
  };

  const updateObject = (objectData) => {
    if (socket && currentSceneId) {
      const authToken = token || 'demo_token';
      socket.emit('object_updated', {
        token: authToken,
        scene_id: currentSceneId,
        object: objectData
      });
    }
  };

  const deleteObject = (objectId) => {
    if (socket && currentSceneId) {
      const authToken = token || 'demo_token';
      socket.emit('object_deleted', {
        token: authToken,
        scene_id: currentSceneId,
        object_id: objectId
      });
    }
  };

  const value = {
    socket,
    connected,
    activeUsers,
    currentSceneId,
    joinScene,
    leaveScene,
    updateObject,
    deleteObject,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};
