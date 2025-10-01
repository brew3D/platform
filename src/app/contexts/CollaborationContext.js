"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
  const [highlights, setHighlights] = useState([]);
  const { token, user } = useAuth();

  // Real-time collaboration using AWS API
  useEffect(() => {
    setConnected(true);
    
    if (!currentSceneId || !user?.userId) return;
    
    // Poll for active users every 3 seconds
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/collaboration/poll?sceneId=${currentSceneId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔄 Polling active users from AWS:', data.activeUsers);
          setActiveUsers(data.activeUsers || []);
        } else {
          console.error('❌ Failed to poll active users:', response.status);
        }
      } catch (error) {
        console.error('❌ Error polling active users:', error);
      }
    }, 3000);

    // Poll for highlights every 2 seconds
    const highlightInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/collaboration/highlight?sceneId=${currentSceneId}`);
        if (response.ok) {
          const data = await response.json();
          setHighlights(data.highlights || []);
        }
      } catch (error) {
        console.error('❌ Error polling highlights:', error);
      }
    }, 2000);
    
    // Heartbeat to keep current user active
    const heartbeatInterval = setInterval(async () => {
      try {
        const userInfo = {
          username: user.name || user.username || 'Current User',
          name: user.name || user.username || 'Current User',
          online: true
        };
        
        const response = await fetch('/api/collaboration/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.userId,
            sceneId: currentSceneId,
            userInfo,
            action: 'heartbeat'
          })
        });
        
        if (response.ok) {
          console.log('💓 Heartbeat sent for user:', user.userId);
        } else {
          console.error('❌ Failed to send heartbeat:', response.status);
        }
      } catch (error) {
        console.error('❌ Error sending heartbeat:', error);
      }
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(highlightInterval);
      clearInterval(heartbeatInterval);
    };
  }, [currentSceneId, user?.userId, user?.name, user?.username]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentSceneId) {
        leaveScene();
      }
    };
  }, [currentSceneId]);

  const joinScene = useCallback(async (sceneId) => {
    if (!user?.userId) {
      // Only log error if we're actually trying to join a scene (not just initializing)
      if (sceneId) {
        console.warn('⚠️ No user ID available for joining scene, skipping...');
      }
      return;
    }

    const userInfo = {
      username: user.name || user.username || 'Current User',
      name: user.name || user.username || 'Current User',
      online: true
    };
    
    console.log('🎬 Joining scene:', sceneId, 'with user:', userInfo);
    setCurrentSceneId(sceneId);
    
    try {
      // Join scene via API
      const response = await fetch('/api/collaboration/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          sceneId,
          userInfo,
          action: 'join'
        })
      });
      
      if (response.ok) {
        console.log('✅ Successfully joined scene via API');
        
        // Log the join action
        if (typeof window !== 'undefined' && window.addCollaborationLog) {
          window.addCollaborationLog('Joined the scene', `Scene: ${sceneId}`);
        }
        
        // Immediately fetch active users
        const pollResponse = await fetch(`/api/collaboration/poll?sceneId=${sceneId}`);
        if (pollResponse.ok) {
          const data = await pollResponse.json();
          console.log('👥 Active users in scene:', data.activeUsers);
          setActiveUsers(data.activeUsers || []);
        }
      } else {
        console.error('❌ Failed to join scene:', response.status);
        setActiveUsers([{ ...userInfo, userId: user.userId }]);
      }
    } catch (error) {
      console.error('❌ Error joining scene:', error);
      setActiveUsers([{ ...userInfo, userId: user.userId }]);
    }
  }, [user?.userId, user?.name, user?.username]);

  const leaveScene = useCallback(async () => {
    if (currentSceneId && user?.userId) {
      console.log('👋 Leaving scene:', currentSceneId, 'user:', user.userId);
      
      try {
        // Leave scene via API
        const response = await fetch('/api/collaboration/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.userId,
            sceneId: currentSceneId,
            action: 'leave'
          })
        });
        
        if (response.ok) {
          console.log('✅ Successfully left scene via API');
          
          // Log the leave action
          if (typeof window !== 'undefined' && window.addCollaborationLog) {
            window.addCollaborationLog('Left the scene', `Scene: ${currentSceneId}`);
          }
        } else {
          console.error('❌ Failed to leave scene:', response.status);
        }
      } catch (error) {
        console.error('❌ Error leaving scene:', error);
      }
      
      setCurrentSceneId(null);
      setActiveUsers([]);
    }
  }, [currentSceneId, user?.userId]);

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

  // Debug function to check localStorage
  const debugLocalStorage = () => {
    if (currentSceneId) {
      const stored = localStorage.getItem(`active_users_${currentSceneId}`);
      console.log('🔍 Debug localStorage for scene', currentSceneId, ':', stored);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('🔍 Parsed users:', parsed);
        } catch (e) {
          console.error('🔍 Error parsing stored users:', e);
        }
      }
    }
  };

  // Highlight an object
  const highlightObject = useCallback(async (objectId) => {
    if (!currentSceneId || !user?.userId) return;

    try {
      const response = await fetch('/api/collaboration/highlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: currentSceneId,
          userId: user.userId,
          userName: user.name || user.username || 'Unknown User',
          objectId,
          action: 'highlight'
        })
      });

      if (response.ok) {
        console.log(`🎯 Highlighted object ${objectId}`);
        // Immediately fetch updated highlights
        fetchHighlights();
      }
    } catch (error) {
      console.error('Error highlighting object:', error);
    }
  }, [currentSceneId, user?.userId, user?.name, user?.username]);

  // Clear highlight
  const clearHighlight = useCallback(async () => {
    if (!currentSceneId || !user?.userId) return;

    try {
      const response = await fetch(`/api/collaboration/highlight?sceneId=${currentSceneId}&userId=${user.userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('🎯 Cleared highlight');
        fetchHighlights();
      }
    } catch (error) {
      console.error('Error clearing highlight:', error);
    }
  }, [currentSceneId, user?.userId]);

  // Fetch current highlights
  const fetchHighlights = useCallback(async () => {
    if (!currentSceneId) return;

    try {
      const response = await fetch(`/api/collaboration/highlight?sceneId=${currentSceneId}`);
      if (response.ok) {
        const data = await response.json();
        setHighlights(data.highlights || []);
      }
    } catch (error) {
      console.error('Error fetching highlights:', error);
    }
  }, [currentSceneId]);

  const value = {
    socket,
    connected,
    activeUsers,
    currentSceneId,
    highlights,
    joinScene,
    leaveScene,
    updateObject,
    deleteObject,
    highlightObject,
    clearHighlight,
    fetchHighlights,
    debugLocalStorage,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};
