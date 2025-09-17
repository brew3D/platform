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
    
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to collaboration server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      setConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    newSocket.on('user_joined', (data) => {
      console.log('User joined:', data);
      setActiveUsers(prev => [...prev, data]);
    });

    newSocket.on('user_left', (data) => {
      console.log('User left:', data);
      setActiveUsers(prev => prev.filter(user => user.user_id !== data.user_id));
    });

    newSocket.on('active_users', (data) => {
      setActiveUsers(data.users);
    });

    newSocket.on('scene_state', (data) => {
      console.log('Received scene state:', data);
      // This will be handled by the editor component
    });

    newSocket.on('object_updated', (data) => {
      console.log('Object updated by another user:', data);
      // This will be handled by the editor component
    });

    newSocket.on('object_deleted', (data) => {
      console.log('Object deleted by another user:', data);
      // This will be handled by the editor component
    });

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
