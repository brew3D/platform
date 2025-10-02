"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { FiPlay, FiPause, FiZoomIn, FiZoomOut, FiFlag } from "react-icons/fi";
import styles from "../editor/editor.module.css";

export default function AnimationTimeline({
  durationSeconds,
  fps,
  playheadSeconds,
  isPlaying,
  zoom,
  markers,
  tracks,
  onPlayToggle,
  onSeek,
  onZoom,
  onAddMarker,
  onClipDrag,
  onSelectItem
}) {
  const totalFrames = Math.round(durationSeconds * fps);
  const grid = useMemo(() => {
    const step = Math.max(1, Math.floor((durationSeconds / Math.max(zoom, 1))));
    const ticks = [];
    for (let s = 0; s <= durationSeconds; s += step) {
      ticks.push({ s, label: secondsToLabel(s) });
    }
    return ticks;
  }, [durationSeconds, zoom]);

  const pxPerSecond = 80 * zoom; // base width per second
  const timelineWidth = Math.max(600, durationSeconds * pxPerSecond + 200);

  return (
    <div className={styles.timelinePanel}>
      <div className={styles.timelineContent}>
        <div className={styles.timelineControls}>
          <button className={styles.playButton} onClick={onPlayToggle}>
            {isPlaying ? <FiPause /> : <FiPlay />} {isPlaying ? "Pause" : "Play"}
          </button>
          <div className={styles.frameInfo}>
            <span>{secondsToLabel(playheadSeconds)} / {secondsToLabel(durationSeconds)}</span>
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
          <button className={styles.toolbarBtn} onClick={() => onZoom(Math.min(zoom + 0.25, 8))} title="Zoom in">
            <FiZoomIn />
          </button>
          <button className={styles.toolbarBtn} onClick={() => onZoom(Math.max(zoom - 0.25, 0.25))} title="Zoom out">
            <FiZoomOut />
          </button>
          <button className={styles.actionBtn} onClick={() => onAddMarker(playheadSeconds)} title="Add marker at playhead">
            <FiFlag />
            <span>Marker</span>
          </button>
        </div>

        <div style={{ marginTop: 14, position: "relative", overflowX: "auto" }}>
          {/* time ruler */}
          <div style={{ position: "relative", height: 24, minWidth: timelineWidth }}>
            {grid.map((g) => (
              <div key={g.s} style={{ position: "absolute", left: g.s * pxPerSecond, top: 0 }}>
                <div style={{ height: 12, width: 1, background: "rgba(255,255,255,0.25)" }} />
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", transform: "translate(-12px, -2px)" }}>{g.label}</div>
              </div>
            ))}
          </div>

          {/* tracks */}
          <div style={{ position: "relative", minWidth: timelineWidth }}>
            {tracks.map((t) => (
              <TrackRow
                key={t.id}
                track={t}
                pxPerSecond={pxPerSecond}
                onSelectItem={onSelectItem}
                onClipDrag={onClipDrag}
              />
            ))}
          </div>

          {/* markers */}
          {markers.map((m) => (
            <div key={m.id} style={{ position: "absolute", top: 0, left: m.time * pxPerSecond, height: "100%", width: 2, background: "rgba(124,58,237,0.9)" }} />
          ))}

          {/* playhead */}
          <motion.div
            aria-label="playhead"
            initial={false}
            animate={{ left: playheadSeconds * pxPerSecond }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            style={{ position: "absolute", top: 24, bottom: 0, width: 2, background: "#a78bfa", pointerEvents: "none" }}
          />
        </div>
      </div>
    </div>
  );
}

function TrackRow({ track, pxPerSecond, onClipDrag, onSelectItem }) {
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
      case 'movement': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'camera': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'audio': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'video': return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      case 'effect': return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
      default: return 'var(--item-bg)';
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "10px 0" }}>
      <div style={{ width: 220, color: "var(--editor-text-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{getTrackIcon(track.type)}</span>
        {track.label}
      </div>
      <div style={{ position: "relative", flex: 1, height: 36, background: "rgba(255,255,255,0.02)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.05)" }}>
        {track.items.map((clip) => (
          <motion.div
            key={clip.id}
            layout
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            onClick={() => onSelectItem(track.id, clip.id)}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", JSON.stringify({ trackId: track.id, clipId: clip.id }))}
            onDragEnd={(e) => onClipDrag?.(track.id, clip.id, e)}
            style={{
              position: "absolute",
              left: (clip.start || clip.time || 0) * pxPerSecond,
              width: Math.max(8, ((clip.end || clip.time || 0) - (clip.start || clip.time || 0)) * pxPerSecond || 20),
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
              fontWeight: 500
            }}
            title={`${clip.label || 'Clip'} ${secondsToLabel(clip.start || clip.time || 0)}–${secondsToLabel(clip.end || clip.time || 0)}`}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {clip.label || 'Keyframe'}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function secondsToLabel(s) {
  const total = Math.max(0, Math.floor(s));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}



