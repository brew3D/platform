"use client";

import React, { createContext, useContext, useReducer, useCallback } from 'react';

const AnimationContext = createContext();

// Action types
const ACTIONS = {
  SET_PLAYHEAD: 'SET_PLAYHEAD',
  SET_PLAYING: 'SET_PLAYING',
  SET_DURATION: 'SET_DURATION',
  SET_FPS: 'SET_FPS',
  ADD_KEYFRAME: 'ADD_KEYFRAME',
  UPDATE_KEYFRAME: 'UPDATE_KEYFRAME',
  DELETE_KEYFRAME: 'DELETE_KEYFRAME',
  ADD_CLIP: 'ADD_CLIP',
  UPDATE_CLIP: 'UPDATE_CLIP',
  DELETE_CLIP: 'DELETE_CLIP',
  ADD_MARKER: 'ADD_MARKER',
  UPDATE_MARKER: 'UPDATE_MARKER',
  DELETE_MARKER: 'DELETE_MARKER',
  SET_ZOOM: 'SET_ZOOM',
  SET_TIMELINE_HEIGHT: 'SET_TIMELINE_HEIGHT',
  SET_INSPECTOR_WIDTH: 'SET_INSPECTOR_WIDTH',
  SET_SELECTED_ITEM: 'SET_SELECTED_ITEM',
  UNDO: 'UNDO',
  REDO: 'REDO',
  SAVE_STATE: 'SAVE_STATE'
};

// Initial state
const initialState = {
  // Playback
  isPlaying: false,
  playheadSeconds: 0,
  durationSeconds: 60,
  fps: 24,
  timelineZoom: 1,
  
  // UI dimensions
  timelineHeight: 200,
  inspectorWidth: 300,
  
  // Animation data
  tracks: [
    { id: 'track-move', type: 'movement', label: 'Character Movement', items: [] },
    { id: 'track-camera', type: 'camera', label: 'Camera Movement', items: [] },
    { id: 'track-audio', type: 'audio', label: 'Audio', items: [] },
    { id: 'track-video', type: 'video', label: 'Video/Overlay', items: [] },
    { id: 'track-fx', type: 'effect', label: 'Special Effects', items: [] },
  ],
  markers: [],
  
  // Selection
  selectedItem: null,
  
  // History for undo/redo
  history: [],
  historyIndex: -1,
  
  // Scene objects
  sceneObjects: []
};

// Reducer
function animationReducer(state, action) {
  const newState = { ...state };
  
  switch (action.type) {
    case ACTIONS.SET_PLAYHEAD:
      newState.playheadSeconds = Math.max(0, Math.min(action.value, state.durationSeconds));
      break;
      
    case ACTIONS.SET_PLAYING:
      newState.isPlaying = action.value;
      break;
      
    case ACTIONS.SET_DURATION:
      newState.durationSeconds = Math.max(1, action.value);
      if (newState.playheadSeconds > newState.durationSeconds) {
        newState.playheadSeconds = newState.durationSeconds;
      }
      break;
      
    case ACTIONS.SET_FPS:
      newState.fps = Math.max(1, Math.min(120, action.value));
      break;
      
    case ACTIONS.ADD_KEYFRAME:
      newState.tracks = state.tracks.map(track => {
        if (track.type === 'movement' && action.trackId === track.id) {
          const existing = track.items.find(item => 
            item.objectId === action.objectId && 
            Math.abs(item.time - action.time) < 0.1
          );
          
          if (existing) {
            return {
              ...track,
              items: track.items.map(item => 
                item.id === existing.id 
                  ? { ...item, ...action.keyframe }
                  : item
            )
          };
          } else {
            return {
              ...track,
              items: [...track.items, {
                id: `kf-${Date.now()}`,
                type: 'movement',
                objectId: action.objectId,
                time: action.time,
                ...action.keyframe,
                active: true
              }]
            };
          }
        }
        return track;
      });
      break;
      
    case ACTIONS.UPDATE_KEYFRAME:
      newState.tracks = state.tracks.map(track => ({
        ...track,
        items: track.items.map(item => 
          item.id === action.keyframeId 
            ? { ...item, ...action.updates }
            : item
        )
      }));
      break;
      
    case ACTIONS.DELETE_KEYFRAME:
      newState.tracks = state.tracks.map(track => ({
        ...track,
        items: track.items.filter(item => item.id !== action.keyframeId)
      }));
      break;
      
    case ACTIONS.ADD_CLIP:
      newState.tracks = state.tracks.map(track => 
        track.id === action.trackId 
          ? { ...track, items: [...track.items, action.clip] }
          : track
      );
      break;
      
    case ACTIONS.UPDATE_CLIP:
      newState.tracks = state.tracks.map(track => ({
        ...track,
        items: track.items.map(item => 
          item.id === action.clipId 
            ? { ...item, ...action.updates }
            : item
        )
      }));
      break;
      
    case ACTIONS.DELETE_CLIP:
      newState.tracks = state.tracks.map(track => ({
        ...track,
        items: track.items.filter(item => item.id !== action.clipId)
      }));
      break;
      
    case ACTIONS.ADD_MARKER:
      newState.markers = [...state.markers, {
        id: `marker-${Date.now()}`,
        time: action.time,
        label: action.label || `Marker ${state.markers.length + 1}`
      }].sort((a, b) => a.time - b.time);
      break;
      
    case ACTIONS.UPDATE_MARKER:
      newState.markers = state.markers.map(marker => 
        marker.id === action.markerId 
          ? { ...marker, ...action.updates }
          : marker
      );
      break;
      
    case ACTIONS.DELETE_MARKER:
      newState.markers = state.markers.filter(marker => marker.id !== action.markerId);
      break;
      
    case ACTIONS.SET_ZOOM:
      newState.timelineZoom = Math.max(0.1, Math.min(10, action.value));
      break;
      
    case ACTIONS.SET_TIMELINE_HEIGHT:
      newState.timelineHeight = Math.max(100, Math.min(400, action.value));
      break;
      
    case ACTIONS.SET_INSPECTOR_WIDTH:
      newState.inspectorWidth = Math.max(200, Math.min(600, action.value));
      break;
      
    case ACTIONS.SET_SELECTED_ITEM:
      newState.selectedItem = action.item;
      break;
      
    case ACTIONS.UNDO:
      if (state.historyIndex > 0) {
        newState.historyIndex = state.historyIndex - 1;
        return { ...state, ...state.history[state.historyIndex - 1] };
      }
      break;
      
    case ACTIONS.REDO:
      if (state.historyIndex < state.history.length - 1) {
        newState.historyIndex = state.historyIndex + 1;
        return { ...state, ...state.history[state.historyIndex + 1] };
      }
      break;
      
    case ACTIONS.SAVE_STATE:
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        tracks: state.tracks,
        markers: state.markers,
        playheadSeconds: state.playheadSeconds,
        durationSeconds: state.durationSeconds,
        fps: state.fps
      });
      newState.history = newHistory;
      newState.historyIndex = newHistory.length - 1;
      break;
      
    default:
      return state;
  }
  
  return newState;
}

// Provider component
export function AnimationProvider({ children }) {
  const [state, dispatch] = useReducer(animationReducer, initialState);
  
  // Action creators
  const actions = {
    setPlayhead: useCallback((seconds) => {
      dispatch({ type: ACTIONS.SET_PLAYHEAD, value: seconds });
    }, []),
    
    setPlaying: useCallback((playing) => {
      dispatch({ type: ACTIONS.SET_PLAYING, value: playing });
    }, []),
    
    setDuration: useCallback((seconds) => {
      dispatch({ type: ACTIONS.SET_DURATION, value: seconds });
    }, []),
    
    setFps: useCallback((fps) => {
      dispatch({ type: ACTIONS.SET_FPS, value: fps });
    }, []),
    
    addKeyframe: useCallback((trackId, objectId, time, keyframe) => {
      dispatch({ type: ACTIONS.ADD_KEYFRAME, trackId, objectId, time, keyframe });
    }, []),
    
    updateKeyframe: useCallback((keyframeId, updates) => {
      dispatch({ type: ACTIONS.UPDATE_KEYFRAME, keyframeId, updates });
    }, []),
    
    deleteKeyframe: useCallback((keyframeId) => {
      dispatch({ type: ACTIONS.DELETE_KEYFRAME, keyframeId });
    }, []),
    
    addClip: useCallback((trackId, clip) => {
      dispatch({ type: ACTIONS.ADD_CLIP, trackId, clip });
    }, []),
    
    updateClip: useCallback((clipId, updates) => {
      dispatch({ type: ACTIONS.UPDATE_CLIP, clipId, updates });
    }, []),
    
    deleteClip: useCallback((clipId) => {
      dispatch({ type: ACTIONS.DELETE_CLIP, clipId });
    }, []),
    
    addMarker: useCallback((time, label) => {
      dispatch({ type: ACTIONS.ADD_MARKER, time, label });
    }, []),
    
    updateMarker: useCallback((markerId, updates) => {
      dispatch({ type: ACTIONS.UPDATE_MARKER, markerId, updates });
    }, []),
    
    deleteMarker: useCallback((markerId) => {
      dispatch({ type: ACTIONS.DELETE_MARKER, markerId });
    }, []),
    
    setZoom: useCallback((zoom) => {
      dispatch({ type: ACTIONS.SET_ZOOM, value: zoom });
    }, []),
    
    setTimelineHeight: useCallback((height) => {
      dispatch({ type: ACTIONS.SET_TIMELINE_HEIGHT, value: height });
    }, []),
    
    setInspectorWidth: useCallback((width) => {
      dispatch({ type: ACTIONS.SET_INSPECTOR_WIDTH, value: width });
    }, []),
    
    setSelectedItem: useCallback((item) => {
      dispatch({ type: ACTIONS.SET_SELECTED_ITEM, item });
    }, []),
    
    undo: useCallback(() => {
      dispatch({ type: ACTIONS.UNDO });
    }, []),
    
    redo: useCallback(() => {
      dispatch({ type: ACTIONS.REDO });
    }, []),
    
    saveState: useCallback(() => {
      dispatch({ type: ACTIONS.SAVE_STATE });
    }, [])
  };
  
  return (
    <AnimationContext.Provider value={{ state, actions }}>
      {children}
    </AnimationContext.Provider>
  );
}

// Hook to use animation context
export function useAnimation() {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
}
