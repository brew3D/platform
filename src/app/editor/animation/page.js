"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../editor.module.css";
import Topbar from "../../Topbar";
import EditorTabs from "../../components/EditorTabs";
import ResizableTimeline from "../../components/ResizableTimeline";
import EnhancedInspector from "../../components/EnhancedInspector";
import ResizableViewport from "../../components/ResizableViewport";
import { AnimationProvider, useAnimation } from "../../contexts/AnimationContext";
import { FiBox, FiCircle, FiSquare, FiMove, FiRotateCw, FiMaximize2, FiSave, FiUpload, FiDownload, FiRotateCcw, FiCornerUpRight } from "react-icons/fi";

function AnimationPageContent() {
  const { state, actions } = useAnimation();
  const [sceneObjects, setSceneObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [transformMode, setTransformMode] = useState('translate');
  const [isTransforming, setIsTransforming] = useState(false);
  const [onionSkinEnabled, setOnionSkinEnabled] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(800);
  const [inspectorWidth, setInspectorWidth] = useState(300);
  
  // Add primitive function
  const addPrimitive = useCallback((type) => {
    const id = `${type}-${Date.now()}`;
    const newObj = {
      id,
      object: type,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      dimensions: type === 'sphere' ? [1, 1, 1] : [1, 1, 1],
      material: '#999999'
    };
    setSceneObjects(prev => [...prev, newObj]);
    actions.saveState();
  }, [actions]);
  
  // Update object function
  const updateObjectField = useCallback((id, field, value) => {
    setSceneObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, [field]: value } : obj
    ));
  }, []);
  
  // Record keyframe on transform end
  const recordKeyframe = useCallback((objectId, position, rotation, scale) => {
    const movementTrack = state.tracks.find(t => t.type === 'movement');
    if (movementTrack) {
      actions.addKeyframe(movementTrack.id, objectId, state.playheadSeconds, {
        position: position || [0,0,0],
        rotation: rotation || [0,0,0],
        scale: scale || [1,1,1],
        easing: 'linear',
        label: `Keyframe ${Math.round(state.playheadSeconds)}s`
      });
    }
  }, [state.tracks, state.playheadSeconds, actions]);
  
  // Drag and drop handlers
  const handleTimelineDrop = useCallback((e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    try {
      const { type, file } = JSON.parse(data);
      const time = state.playheadSeconds;
      
      if (type === 'audio') {
        const audioTrack = state.tracks.find(t => t.type === 'audio');
        if (audioTrack) {
          const clip = {
            id: `audio-${Date.now()}`,
            type: 'audio',
            clip: file.name,
            startTime: time,
            endTime: time + 10,
            volume: 1,
            loop: false,
            active: true,
            label: file.name
          };
          actions.addClip(audioTrack.id, clip);
        }
      }
    } catch (err) {
      console.warn('Invalid drop data:', err);
    }
  }, [state.playheadSeconds, state.tracks, actions]);
  
  const handleTimelineDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);
  
  // Preview export function
  const exportPreview = useCallback(() => {
    const animationData = {
      animationId: `anim-${Date.now()}`,
      projectId: 'current',
      name: 'Animation Preview',
      duration: state.durationSeconds,
      fps: state.fps,
      tracks: state.tracks.map(track => ({
        type: track.type,
        targetId: track.id,
        keyframes: track.items.map(item => ({
          time: item.time,
          position: item.position || [0,0,0],
          rotation: item.rotation || [0,0,0],
          scale: item.scale || [1,1,1],
          easing: item.easing || 'linear'
        }))
      })),
      markers: state.markers
    };
    
    console.log('Exporting animation:', animationData);
    // In a real implementation, this would trigger video rendering
    alert('Preview export started! Check console for animation data.');
  }, [state]);
  
  // Save/Load functions
  const saveAnimation = useCallback(async () => {
    const animationData = {
      projectId: 'current',
      animationId: `anim-${Date.now()}`,
      name: 'My Animation',
      duration: state.durationSeconds,
      fps: state.fps,
      tracks: state.tracks,
      markers: state.markers,
      sceneObjects: sceneObjects
    };
    
    try {
      const response = await fetch('/api/animations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(animationData)
      });
      
      if (response.ok) {
        alert('Animation saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save animation:', error);
      alert('Failed to save animation');
    }
  }, [state, sceneObjects]);
  
  const loadAnimation = useCallback(async (animationId) => {
    try {
      const response = await fetch(`/api/animations/${animationId}`);
      const data = await response.json();
      
      // Restore animation state
      actions.setDuration(data.duration);
      actions.setFps(data.fps);
      // Restore tracks, markers, etc.
      
      alert('Animation loaded successfully!');
    } catch (error) {
      console.error('Failed to load animation:', error);
      alert('Failed to load animation');
    }
  }, [actions]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              actions.redo();
            } else {
              actions.undo();
            }
            break;
          case 's':
            e.preventDefault();
            saveAnimation();
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, saveAnimation]);

  return (
    <div className={styles.editorContainer}>
      <Topbar />
      <EditorTabs />

      {/* Enhanced Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${transformMode === 'translate' ? styles.active : ''}`}
            onClick={() => setTransformMode('translate')}
            title="Move Tool (G)"
          >
            <FiMove />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${transformMode === 'rotate' ? styles.active : ''}`}
            onClick={() => setTransformMode('rotate')}
            title="Rotate Tool (R)"
          >
            <FiRotateCw />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${transformMode === 'scale' ? styles.active : ''}`}
            onClick={() => setTransformMode('scale')}
            title="Scale Tool (S)"
          >
            <FiMaximize2 />
          </button>
        </div>
        
        <div className={styles.toolbarSection}>
          <button className={styles.toolbarBtn} onClick={() => addPrimitive('cube')}>
            <FiBox /> Cube
          </button>
          <button className={styles.toolbarBtn} onClick={() => addPrimitive('sphere')}>
            <FiCircle /> Sphere
          </button>
          <button className={styles.toolbarBtn} onClick={() => addPrimitive('plane')}>
            <FiSquare /> Plane
          </button>
        </div>
        
        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${onionSkinEnabled ? styles.active : ''}`}
            onClick={() => setOnionSkinEnabled(!onionSkinEnabled)}
            title="Toggle onion skinning"
          >
            👻 Onion
          </button>
          <button className={styles.actionBtn} onClick={exportPreview}>
            🎬 Export Preview
          </button>
        </div>
        
        <div className={styles.toolbarSpacer} />
        
        <div className={styles.toolbarSection}>
          <button 
            className={styles.toolbarBtn}
            onClick={actions.undo}
            disabled={state.historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <FiRotateCcw />
          </button>
          <button 
            className={styles.toolbarBtn}
            onClick={actions.redo}
            disabled={state.historyIndex >= state.history.length - 1}
            title="Redo (Ctrl+Shift+Z)"
          >
            <FiCornerUpRight />
          </button>
        </div>
        
        <div className={styles.toolbarSection}>
          <button className={styles.actionBtn} onClick={saveAnimation}>
            <FiSave /> Save
          </button>
          <button className={styles.actionBtn} onClick={() => loadAnimation('demo')}>
            <FiUpload /> Load
          </button>
        </div>
        
        <div className={styles.toolbarSection}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span>Duration</span>
            <input 
              type="number" 
              className={styles.snapInput} 
              value={state.durationSeconds} 
              onChange={(e) => actions.setDuration(Number(e.target.value) || 1)} 
            />
            <span>sec</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span>FPS</span>
            <input 
              type="number" 
              className={styles.snapInput} 
              value={state.fps} 
              onChange={(e) => actions.setFps(Number(e.target.value) || 1)} 
            />
          </div>
        </div>
      </div>

      {/* Main Layout with Resizable Panels */}
      <div className={styles.mainLayout} style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
        {/* Resizable Viewport */}
        <ResizableViewport
          sceneObjects={sceneObjects}
          selectedId={selectedId}
          transformMode={transformMode}
          isTransforming={isTransforming}
          playheadSeconds={state.playheadSeconds}
          isPlaying={state.isPlaying}
          onionSkinEnabled={onionSkinEnabled}
          timelineTracks={state.tracks}
          onObjectSelect={setSelectedId}
          onTransformStart={setIsTransforming}
          onTransformEnd={(position, rotation, scale) => {
            setIsTransforming(false);
            recordKeyframe(selectedId, position, rotation, scale);
          }}
          onAddPrimitive={addPrimitive}
          onClearScene={() => setSceneObjects([])}
          onUpdateObject={updateObjectField}
          onRecordKeyframe={recordKeyframe}
          viewportWidth={viewportWidth}
          onWidthChange={setViewportWidth}
        />

        {/* Resizable Inspector */}
        <div 
          className={styles.rightColumn}
          style={{ width: inspectorWidth, minWidth: 200, maxWidth: 600 }}
        >
          <div className={styles.rightPaneTop}>
            <div className={styles.panelHeader}>
              <h3>Animation Inspector</h3>
            </div>
            <EnhancedInspector 
              selected={state.selectedItem} 
              onChange={actions.setSelectedItem}
              onDelete={(id) => {
                actions.deleteClip(id);
                actions.deleteKeyframe(id);
              }}
              onDuplicate={(item) => {
                const newItem = { ...item, id: `${item.id}-copy-${Date.now()}` };
                actions.addClip(item.trackId, newItem);
              }}
              onSave={actions.saveState}
              inspectorWidth={inspectorWidth}
              onWidthChange={setInspectorWidth}
            />
          </div>
          
          <div className={styles.rightPaneBottom}>
            <div className={styles.panelHeader}>
              <h3>Asset Library</h3>
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ 
                border: '2px dashed rgba(102,126,234,0.3)', 
                borderRadius: 8, 
                padding: '2rem', 
                textAlign: 'center',
                background: 'rgba(102,126,234,0.05)'
              }}>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--editor-text-primary)' }}>Drop audio/video files here</p>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const data = { type: 'audio', file };
                      const event = new Event('drop');
                      event.dataTransfer = { getData: () => JSON.stringify(data) };
                      handleTimelineDrop(event);
                    }
                  }}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload" 
                  style={{ 
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Choose File
                </label>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ margin: 0, color: 'var(--editor-text-primary)', fontSize: '0.9rem' }}>Quick Actions</h4>
                <button 
                  className={styles.actionBtn}
                  onClick={() => {
                    const audioTrack = state.tracks.find(t => t.type === 'audio');
                    if (audioTrack) {
                      const clip = {
                        id: `audio-${Date.now()}`,
                        type: 'audio',
                        clip: 'background-music.mp3',
                        startTime: state.playheadSeconds,
                        endTime: state.playheadSeconds + 30,
                        volume: 0.8,
                        loop: false,
                        active: true,
                        label: 'Background Music'
                      };
                      actions.addClip(audioTrack.id, clip);
                    }
                  }}
                >
                  🎵 Add Background Music
                </button>
                <button 
                  className={styles.actionBtn}
                  onClick={() => {
                    const effectTrack = state.tracks.find(t => t.type === 'effect');
                    if (effectTrack) {
                      const clip = {
                        id: `effect-${Date.now()}`,
                        type: 'effect',
                        effect: 'bloom',
                        intensity: 0.5,
                        duration: 2,
                        startTime: state.playheadSeconds,
                        endTime: state.playheadSeconds + 2,
                        active: true,
                        label: 'Bloom Effect'
                      };
                      actions.addClip(effectTrack.id, clip);
                    }
                  }}
                >
                  ✨ Add Bloom Effect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resizable Timeline */}
      <div 
        onDrop={handleTimelineDrop}
        onDragOver={handleTimelineDragOver}
        style={{ height: state.timelineHeight }}
      >
        <ResizableTimeline
          durationSeconds={state.durationSeconds}
          fps={state.fps}
          playheadSeconds={state.playheadSeconds}
          isPlaying={state.isPlaying}
          zoom={state.timelineZoom}
          markers={state.markers}
          tracks={state.tracks}
          timelineHeight={state.timelineHeight}
          onPlayToggle={() => actions.setPlaying(!state.isPlaying)}
          onSeek={actions.setPlayhead}
          onZoom={actions.setZoom}
          onAddMarker={(time) => actions.addMarker(time, `Marker ${state.markers.length + 1}`)}
          onClipDrag={(trackId, clipId, newTime, newDuration) => {
            actions.updateClip(clipId, { time: newTime, start: newTime, end: newDuration });
          }}
          onSelectItem={(trackId, clipId) => {
            const track = state.tracks.find((tr) => tr.id === trackId);
            const item = track?.items.find((it) => it.id === clipId);
            if (item) actions.setSelectedItem(item);
          }}
          onUpdateClip={actions.updateClip}
          onTimelineHeightChange={actions.setTimelineHeight}
          onSnapToFrame={(time) => Math.round(time * state.fps) / state.fps}
          onSnapToMarker={(time) => {
            const nearest = state.markers.reduce((closest, marker) => 
              Math.abs(marker.time - time) < Math.abs(closest.time - time) ? marker : closest
            );
            return nearest.time;
          }}
        />
      </div>
    </div>
  );
}

export default function AnimationPage() {
  return (
    <AnimationProvider>
      <AnimationPageContent />
    </AnimationProvider>
  );
}


