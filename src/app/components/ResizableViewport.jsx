"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls, PerspectiveCamera, Environment, TransformControls } from "@react-three/drei";
import { motion } from "framer-motion";
import SelectableMesh from "./selectableMesh";
import { FiGrid, FiLayers, FiSun, FiMoon, FiTrash2, FiBox, FiCircle, FiSquare, FiMove, FiRotateCw, FiMaximize2 } from "react-icons/fi";
import styles from "../editor/editor.module.css";

export default function ResizableViewport({
  sceneObjects,
  selectedId,
  transformMode,
  isTransforming,
  playheadSeconds,
  isPlaying,
  onionSkinEnabled,
  timelineTracks,
  onObjectSelect,
  onTransformStart,
  onTransformEnd,
  onAddPrimitive,
  onClearScene,
  onUpdateObject,
  onRecordKeyframe,
  viewportWidth,
  onWidthChange
}) {
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [gridTheme, setGridTheme] = useState('dark');
  const [isResizing, setIsResizing] = useState(false);
  const viewportRef = useRef(null);
  
  const toggleGridTheme = () => setGridTheme((g) => (g === 'light' ? 'dark' : 'light'));
  
  // Handle viewport resize
  const handleResize = useCallback((e) => {
    if (!isResizing) return;
    
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect) {
      const newWidth = Math.max(300, Math.min(1200, e.clientX - rect.left));
      onWidthChange(newWidth);
    }
  }, [isResizing, onWidthChange]);
  
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', () => setIsResizing(false));
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', () => setIsResizing(false));
      };
    }
  }, [isResizing, handleResize]);
  
  // Get object at current playhead time
  const getObjectAtTime = useCallback((obj, time) => {
    const movementTrack = timelineTracks.find(t => t.type === 'movement');
    const keyframes = movementTrack?.items
      .filter(item => item.objectId === obj.id)
      .sort((a, b) => a.time - b.time) || [];
    
    if (keyframes.length === 0) return obj;
    
    // Find surrounding keyframes
    let before = null;
    let after = null;
    
    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i].time <= time) {
        before = keyframes[i];
      }
      if (keyframes[i].time >= time && !after) {
        after = keyframes[i];
        break;
      }
    }
    
    // If exact match, return that keyframe
    if (before && Math.abs(before.time - time) < 0.01) {
      return {
        ...obj,
        position: before.position || obj.position,
        rotation: before.rotation || obj.rotation,
        dimensions: before.scale || obj.dimensions
      };
    }
    
    // Interpolate between keyframes
    if (before && after) {
      const t = (time - before.time) / (after.time - before.time);
      const ease = getEasingFunction(before.easing || 'linear');
      const easedT = ease(t);
      
      return {
        ...obj,
        position: interpolateArray(
          before.position || obj.position,
          after.position || obj.position,
          easedT
        ),
        rotation: interpolateArray(
          before.rotation || obj.rotation,
          after.rotation || obj.rotation,
          easedT
        ),
        dimensions: interpolateArray(
          before.scale || obj.dimensions,
          after.scale || obj.dimensions,
          easedT
        )
      };
    }
    
    // Return closest keyframe
    if (before) {
      return {
        ...obj,
        position: before.position || obj.position,
        rotation: before.rotation || obj.rotation,
        dimensions: before.scale || obj.dimensions
      };
    }
    
    return obj;
  }, [timelineTracks]);
  
  return (
    <div 
      className={styles.viewportContainer}
      style={{ width: viewportWidth }}
      ref={viewportRef}
    >
      {/* Viewport Header */}
      <div className={styles.viewportHeader}>
        <div className={styles.viewportInfo}>
          <span>Animation Preview</span>
          <div style={{ fontSize: '0.8rem', color: 'var(--editor-text-secondary)' }}>
            {isPlaying ? 'Playing' : 'Paused'} • {formatTime(playheadSeconds)}
          </div>
        </div>
        
        <div className={styles.viewportControls}>
          <button 
            className={`${styles.toolbarBtn} ${transformMode === 'translate' ? styles.active : ''}`}
            onClick={() => onTransformModeChange?.('translate')}
            title="Move Tool"
          >
            <FiMove />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${transformMode === 'rotate' ? styles.active : ''}`}
            onClick={() => onTransformModeChange?.('rotate')}
            title="Rotate Tool"
          >
            <FiRotateCw />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${transformMode === 'scale' ? styles.active : ''}`}
            onClick={() => onTransformModeChange?.('scale')}
            title="Scale Tool"
          >
            <FiMaximize2 />
          </button>
          
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)', margin: '0 8px' }} />
          
          <button 
            className={`${styles.toolbarBtn} ${showGrid ? styles.active : ''}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            <FiGrid />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${showAxes ? styles.active : ''}`}
            onClick={() => setShowAxes(!showAxes)}
            title="Toggle Axes"
          >
            <FiLayers />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${gridTheme === 'light' ? styles.active : ''}`}
            onClick={toggleGridTheme}
            title="Toggle Theme"
          >
            {gridTheme === 'light' ? <FiSun /> : <FiMoon />}
          </button>
          <button 
            className={styles.clearSceneBtn}
            onClick={onClearScene}
            title="Clear Scene"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
      
      {/* 3D Viewport */}
      <div className={styles.viewport}>
        <Canvas 
          shadows 
          camera={{ position: [5, 5, 8], fov: 50 }} 
          style={{ background: gridTheme === 'light' ? '#f0f0f0' : '#1a1a1a' }}
          onPointerMissed={() => onObjectSelect?.(null)}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={0.7} />
          <PerspectiveCamera makeDefault position={[5, 5, 8]} fov={50} />
          <OrbitControls makeDefault enableRotate enablePan enableZoom />
          <Environment preset={'sunset'} />
          
          {showGrid && <Grid args={[10, 10]} />} 
          {showAxes && <axesHelper args={[5]} />}
          
          {/* Render objects at current time */}
          {sceneObjects.map((obj) => {
            const animatedObj = getObjectAtTime(obj, playheadSeconds);
            const movementTrack = timelineTracks.find(t => t.type === 'movement');
            const keyframes = movementTrack?.items.filter(item => item.objectId === obj.id) || [];
            
            return (
              <React.Fragment key={obj.id}>
                {/* Main object */}
                <SelectableMesh
                  o={animatedObj}
                  updateObject={onUpdateObject}
                  onTransformChange={undefined}
                  onTransformStart={() => onTransformStart?.(true)}
                  onTransformEnd={(position, rotation, scale) => {
                    onTransformEnd?.(false);
                    onRecordKeyframe?.(obj.id, position, rotation, scale);
                  }}
                  selectedId={selectedId}
                  setSelectedId={onObjectSelect}
                  transformMode={transformMode}
                  coordinateSystem="global"
                  snapEnabled={false}
                  snapValue={0.1}
                  highlights={[]}
                />
                
                {/* Onion skinning - show previous keyframes as ghost objects */}
                {onionSkinEnabled && keyframes.map((kf, index) => {
                  if (kf.time >= playheadSeconds || index === keyframes.length - 1) return null;
                  
                  return (
                    <SelectableMesh
                      key={`onion-${obj.id}-${kf.id}`}
                      o={{
                        ...obj,
                        position: kf.position || obj.position,
                        rotation: kf.rotation || obj.rotation,
                        dimensions: kf.scale || obj.dimensions,
                        material: '#666666'
                      }}
                      updateObject={() => {}}
                      onTransformChange={undefined}
                      onTransformStart={() => {}}
                      onTransformEnd={() => {}}
                      selectedId={null}
                      setSelectedId={() => {}}
                      transformMode="translate"
                      coordinateSystem="global"
                      snapEnabled={false}
                      snapValue={0.1}
                      highlights={[]}
                      opacity={0.3}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </Canvas>
      </div>
      
      {/* Resize Handle */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 4,
          height: '100%',
          background: 'linear-gradient(180deg, #6b4423, #8b5a2b)',
          cursor: 'ew-resize',
          opacity: 0,
          transition: 'opacity 0.2s'
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        onMouseEnter={(e) => {
          e.target.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = '0';
        }}
      />
    </div>
  );
}

// Easing functions
function getEasingFunction(easing) {
  switch (easing) {
    case 'ease-in':
      return t => t * t;
    case 'ease-out':
      return t => 1 - (1 - t) * (1 - t);
    case 'ease-in-out':
      return t => t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
    case 'bounce':
      return t => {
        if (t < 1/2.75) return 7.5625 * t * t;
        if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
        if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
        return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
      };
    case 'elastic':
      return t => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * (2 * Math.PI) / 0.4) + 1;
      };
    default:
      return t => t;
  }
}

// Linear interpolation between two arrays
function interpolateArray(a, b, t) {
  return a.map((val, i) => val + (b[i] - val) * t);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
