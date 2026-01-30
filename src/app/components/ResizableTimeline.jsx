"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, useDragControls } from "framer-motion";
import { FiPlay, FiPause, FiZoomIn, FiZoomOut, FiFlag, FiGripVertical } from "react-icons/fi";
import styles from "../editor/editor.module.css";

export default function ResizableTimeline({
  durationSeconds,
  fps,
  playheadSeconds,
  isPlaying,
  zoom,
  markers,
  tracks,
  timelineHeight,
  onPlayToggle,
  onSeek,
  onZoom,
  onAddMarker,
  onClipDrag,
  onSelectItem,
  onUpdateClip,
  onTimelineHeightChange,
  onSnapToFrame,
  onSnapToMarker
}) {
  const timelineRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [dragData, setDragData] = useState(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  
  const totalFrames = Math.round(durationSeconds * fps);
  const pxPerSecond = 80 * zoom;
  const timelineWidth = Math.max(600, durationSeconds * pxPerSecond + 200);
  
  // Snap to frame/marker
  const snapToTime = useCallback((time) => {
    if (!snapEnabled) return time;
    
    const frameTime = Math.round(time * fps) / fps;
    const nearestMarker = markers.reduce((closest, marker) => {
      const distance = Math.abs(marker.time - time);
      const closestDistance = Math.abs(closest.time - time);
      return distance < closestDistance ? marker : closest;
    }, { time: frameTime });
    
    const markerDistance = Math.abs(nearestMarker.time - time);
    const frameDistance = Math.abs(frameTime - time);
    
    return markerDistance < frameDistance ? nearestMarker.time : frameTime;
  }, [snapEnabled, fps, markers]);
  
  // Handle timeline click to seek
  const handleTimelineClick = useCallback((e) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 220; // Account for track labels
    const time = Math.max(0, Math.min(durationSeconds, x / pxPerSecond));
    const snappedTime = snapToTime(time);
    
    onSeek(snappedTime);
  }, [durationSeconds, pxPerSecond, snapToTime, onSeek]);
  
  // Handle clip dragging
  const handleClipDrag = useCallback((clipId, trackId, newTime, newDuration) => {
    const snappedTime = snapToTime(newTime);
    const snappedDuration = snapToTime(newDuration) - snappedTime;
    
    onUpdateClip(clipId, {
      time: snappedTime,
      start: snappedTime,
      end: snappedTime + snappedDuration
    });
  }, [snapToTime, onUpdateClip]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          onPlayToggle();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onSeek(Math.max(0, playheadSeconds - (1 / fps)));
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSeek(Math.min(durationSeconds, playheadSeconds + (1 / fps)));
          break;
        case 'm':
          e.preventDefault();
          onAddMarker(playheadSeconds);
          break;
        case 's':
          e.preventDefault();
          setSnapEnabled(!snapEnabled);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playheadSeconds, fps, durationSeconds, onPlayToggle, onSeek, onAddMarker, snapEnabled]);
  
  return (
    <div 
      className={styles.timelinePanel}
      style={{ height: timelineHeight }}
      ref={timelineRef}
    >
      {/* Timeline Controls */}
      <div className={styles.timelineContent}>
        <div className={styles.timelineControls}>
          <button className={styles.playButton} onClick={onPlayToggle}>
            {isPlaying ? <FiPause /> : <FiPlay />} {isPlaying ? "Pause" : "Play"}
          </button>
          
          <div className={styles.frameInfo}>
            <span>{formatTime(playheadSeconds)} / {formatTime(durationSeconds)}</span>
            <span>{Math.round(playheadSeconds * fps)} / {totalFrames} f @ {fps} fps</span>
          </div>
          
          <div className={styles.timelineSlider}>
            <input
              type="range"
              min={0}
              max={durationSeconds}
              step={1 / fps}
              value={playheadSeconds}
              onChange={(e) => onSeek(Number(e.target.value))}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className={styles.toolbarBtn} 
              onClick={() => onZoom(Math.min(zoom + 0.25, 8))} 
              title="Zoom in"
            >
              <FiZoomIn />
            </button>
            <button 
              className={styles.toolbarBtn} 
              onClick={() => onZoom(Math.max(zoom - 0.25, 0.25))} 
              title="Zoom out"
            >
              <FiZoomOut />
            </button>
            <button 
              className={`${styles.toolbarBtn} ${snapEnabled ? styles.active : ''}`}
              onClick={() => setSnapEnabled(!snapEnabled)}
              title="Toggle snapping (S)"
            >
              S
            </button>
            <button 
              className={styles.actionBtn} 
              onClick={() => onAddMarker(playheadSeconds)}
              title="Add marker (M)"
            >
              <FiFlag />
              <span>Marker</span>
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        <div 
          style={{ 
            marginTop: 14, 
            position: "relative", 
            overflowX: "auto",
            height: timelineHeight - 100,
            cursor: 'crosshair'
          }}
          onClick={handleTimelineClick}
        >
          {/* Time Ruler */}
          <TimeRuler 
            durationSeconds={durationSeconds}
            pxPerSecond={pxPerSecond}
            timelineWidth={timelineWidth}
            markers={markers}
          />
          
          {/* Tracks */}
          <div style={{ position: "relative", minWidth: timelineWidth }}>
            {tracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                pxPerSecond={pxPerSecond}
                onSelectItem={onSelectItem}
                onClipDrag={handleClipDrag}
                snapToTime={snapToTime}
                snapEnabled={snapEnabled}
              />
            ))}
          </div>
          
          {/* Playhead */}
          <motion.div
            aria-label="playhead"
            initial={false}
            animate={{ left: playheadSeconds * pxPerSecond + 220 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            style={{ 
              position: "absolute", 
              top: 24, 
              bottom: 0, 
              width: 2, 
              background: "#a78bfa", 
              pointerEvents: "none",
              zIndex: 10
            }}
          />
        </div>
      </div>
      
      {/* Resize Handle */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #6b4423, #8b5a2b)',
          cursor: 'ns-resize',
          opacity: 0,
          transition: 'opacity 0.2s'
        }}
        onMouseDown={(e) => {
          setIsResizing(true);
          const startY = e.clientY;
          const startHeight = timelineHeight;
          
          const handleMouseMove = (e) => {
            const deltaY = e.clientY - startY;
            const newHeight = Math.max(100, Math.min(400, startHeight - deltaY));
            onTimelineHeightChange(newHeight);
          };
          
          const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
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

function TimeRuler({ durationSeconds, pxPerSecond, timelineWidth, markers }) {
  const step = Math.max(1, Math.floor(durationSeconds / 10));
  const ticks = [];
  
  for (let s = 0; s <= durationSeconds; s += step) {
    ticks.push({ s, label: formatTime(s) });
  }
  
  return (
    <div style={{ position: "relative", height: 24, minWidth: timelineWidth, marginLeft: 220 }}>
      {ticks.map((tick) => (
        <div key={tick.s} style={{ position: "absolute", left: tick.s * pxPerSecond, top: 0 }}>
          <div style={{ height: 12, width: 1, background: "rgba(255,255,255,0.25)" }} />
          <div style={{ 
            fontSize: 12, 
            color: "rgba(255,255,255,0.75)", 
            transform: "translate(-12px, -2px)",
            whiteSpace: 'nowrap'
          }}>
            {tick.label}
          </div>
        </div>
      ))}
      
      {/* Markers */}
      {markers.map((marker) => (
        <div 
          key={marker.id} 
          style={{ 
            position: "absolute", 
            top: 0, 
            left: marker.time * pxPerSecond, 
            height: "100%", 
            width: 2, 
            background: "rgba(124,58,237,0.9)",
            zIndex: 5
          }}
          title={marker.label}
        />
      ))}
    </div>
  );
}

function TrackRow({ track, pxPerSecond, onSelectItem, onClipDrag, snapToTime, snapEnabled }) {
  const getTrackIcon = (type) => {
    switch (type) {
      case 'movement': return '🎭';
      case 'camera': return '📹';
      case 'audio': return '🎵';
      case 'video': return '🎬';
      case 'effect': return '✨';
      default: return '📝';
    }
  };

  const getClipColor = (type) => {
    switch (type) {
      case 'movement': return 'linear-gradient(135deg, #6b4423 0%, #8b5a2b 100%)';
      case 'camera': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'audio': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'video': return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      case 'effect': return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
      default: return 'var(--item-bg)';
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: 12, 
      borderBottom: "1px solid rgba(255,255,255,0.08)", 
      padding: "10px 0",
      minHeight: 40
    }}>
      <div style={{ 
        width: 220, 
        color: "var(--editor-text-primary)", 
        fontWeight: 600, 
        display: "flex", 
        alignItems: "center", 
        gap: 8 
      }}>
        <span style={{ fontSize: 16 }}>{getTrackIcon(track.type)}</span>
        {track.label}
      </div>
      
      <div style={{ 
        position: "relative", 
        flex: 1, 
        height: 36, 
        background: "rgba(255,255,255,0.02)", 
        borderRadius: 6, 
        border: "1px solid rgba(255,255,255,0.05)" 
      }}>
        {track.items.map((clip) => (
          <DraggableClip
            key={clip.id}
            clip={clip}
            track={track}
            pxPerSecond={pxPerSecond}
            onSelectItem={onSelectItem}
            onClipDrag={onClipDrag}
            snapToTime={snapToTime}
            snapEnabled={snapEnabled}
            getClipColor={getClipColor}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableClip({ clip, track, pxPerSecond, onSelectItem, onClipDrag, snapToTime, snapEnabled, getClipColor }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  
  const startTime = clip.start || clip.time || 0;
  const endTime = clip.end || clip.time + 1 || 1;
  const duration = endTime - startTime;
  
  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, startTime, endTime });
    onSelectItem(track.id, clip.id);
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging || !dragStart) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaTime = deltaX / pxPerSecond;
    const newStartTime = snapToTime(startTime + deltaTime);
    const newEndTime = snapToTime(endTime + deltaTime);
    
    onClipDrag(clip.id, track.id, newStartTime, newEndTime);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);
  
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      onClick={() => onSelectItem(track.id, clip.id)}
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        left: startTime * pxPerSecond,
        width: Math.max(8, duration * pxPerSecond),
        height: 28,
        borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.2)",
        background: clip.active ? getClipColor(track.type) : "rgba(255,255,255,0.1)",
        color: "var(--editor-text-primary)",
        boxShadow: clip.active ? "0 4px 12px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.1)",
        cursor: "grab",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        fontSize: 11,
        fontWeight: 500,
        userSelect: "none",
        zIndex: isDragging ? 10 : 1
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title={`${clip.label || 'Clip'} ${formatTime(startTime)}–${formatTime(endTime)}`}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {clip.label || 'Keyframe'}
      </span>
    </motion.div>
  );
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
