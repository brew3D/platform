"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiChevronRight, FiTrash2, FiCopy, FiSave } from "react-icons/fi";
import styles from "../editor/editor.module.css";

export default function EnhancedInspector({ 
  selectedItem, 
  onChange, 
  onDelete,
  onDuplicate,
  onSave,
  inspectorWidth,
  onWidthChange 
}) {
  const [expandedSections, setExpandedSections] = useState({
    transform: true,
    animation: true,
    properties: true
  });
  
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);
  
  const handleChange = useCallback((updates) => {
    if (selectedItem) {
      onChange({ ...selectedItem, ...updates });
    }
  }, [selectedItem, onChange]);
  
  if (!selectedItem) {
    return (
      <div className={styles.propertiesContent}>
        <div className={styles.propertyGroup}>
          <h4>Inspector</h4>
          <div className={styles.transformInputs}>
            <p style={{ color: 'var(--editor-text-secondary)', textAlign: 'center', margin: '2rem 0' }}>
              Select a clip or keyframe to edit properties
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={styles.propertiesContent}
      style={{ width: inspectorWidth }}
    >
      {/* Inspector Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '0.5rem',
        background: 'rgba(102,126,234,0.1)',
        borderRadius: 8
      }}>
        <h4 style={{ margin: 0, color: 'var(--editor-text-primary)' }}>
          {selectedItem.type === 'movement' ? 'Keyframe' : 
           selectedItem.type === 'audio' ? 'Audio Clip' :
           selectedItem.type === 'video' ? 'Video Clip' :
           selectedItem.type === 'effect' ? 'Effect' : 'Clip'}
        </h4>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            className={styles.toolbarBtn}
            onClick={() => onDuplicate?.(selectedItem)}
            title="Duplicate"
          >
            <FiCopy />
          </button>
          <button 
            className={styles.toolbarBtn}
            onClick={() => onSave?.(selectedItem)}
            title="Save"
          >
            <FiSave />
          </button>
          <button 
            className={styles.toolbarBtn}
            onClick={() => onDelete?.(selectedItem.id)}
            title="Delete"
            style={{ color: '#ef4444' }}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
      
      {/* Transform Section */}
      {(selectedItem.type === 'movement' || selectedItem.position) && (
        <PropertySection
          title="Transform"
          expanded={expandedSections.transform}
          onToggle={() => toggleSection('transform')}
        >
          <TransformControls 
            item={selectedItem} 
            onChange={handleChange}
          />
        </PropertySection>
      )}
      
      {/* Animation Section */}
      {selectedItem.type === 'movement' && (
        <PropertySection
          title="Animation"
          expanded={expandedSections.animation}
          onToggle={() => toggleSection('animation')}
        >
          <AnimationControls 
            item={selectedItem} 
            onChange={handleChange}
          />
        </PropertySection>
      )}
      
      {/* Audio Section */}
      {selectedItem.type === 'audio' && (
        <PropertySection
          title="Audio Properties"
          expanded={expandedSections.properties}
          onToggle={() => toggleSection('properties')}
        >
          <AudioControls 
            item={selectedItem} 
            onChange={handleChange}
          />
        </PropertySection>
      )}
      
      {/* Video Section */}
      {selectedItem.type === 'video' && (
        <PropertySection
          title="Video Properties"
          expanded={expandedSections.properties}
          onToggle={() => toggleSection('properties')}
        >
          <VideoControls 
            item={selectedItem} 
            onChange={handleChange}
          />
        </PropertySection>
      )}
      
      {/* Effect Section */}
      {selectedItem.type === 'effect' && (
        <PropertySection
          title="Effect Properties"
          expanded={expandedSections.properties}
          onToggle={() => toggleSection('properties')}
        >
          <EffectControls 
            item={selectedItem} 
            onChange={handleChange}
          />
        </PropertySection>
      )}
    </div>
  );
}

function PropertySection({ title, expanded, onToggle, children }) {
  return (
    <div className={styles.propertyGroup}>
      <div 
        className={styles.propertyGroupHeader}
        onClick={onToggle}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          cursor: 'pointer',
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
          borderBottom: '1px solid rgba(102, 126, 234, 0.2)',
          userSelect: 'none'
        }}
      >
        {expanded ? <FiChevronDown /> : <FiChevronRight />}
        <h4 style={{ margin: 0, color: 'var(--editor-text-primary)' }}>{title}</h4>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.transformInputs}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TransformControls({ item, onChange }) {
  const position = item.position || [0, 0, 0];
  const rotation = item.rotation || [0, 0, 0];
  const scale = item.scale || item.dimensions || [1, 1, 1];
  
  return (
    <>
      <Row label="Position">
        <NumberInput 
          value={position[0]} 
          onChange={(v) => onChange({ position: [v, position[1], position[2]] })}
          step={0.1}
        />
        <NumberInput 
          value={position[1]} 
          onChange={(v) => onChange({ position: [position[0], v, position[2]] })}
          step={0.1}
        />
        <NumberInput 
          value={position[2]} 
          onChange={(v) => onChange({ position: [position[0], position[1], v] })}
          step={0.1}
        />
      </Row>
      
      <Row label="Rotation">
        <NumberInput 
          value={rotation[0]} 
          onChange={(v) => onChange({ rotation: [v, rotation[1], rotation[2]] })}
          step={1}
          min={-360}
          max={360}
        />
        <NumberInput 
          value={rotation[1]} 
          onChange={(v) => onChange({ rotation: [rotation[0], v, rotation[2]] })}
          step={1}
          min={-360}
          max={360}
        />
        <NumberInput 
          value={rotation[2]} 
          onChange={(v) => onChange({ rotation: [rotation[0], rotation[1], v] })}
          step={1}
          min={-360}
          max={360}
        />
      </Row>
      
      <Row label="Scale">
        <NumberInput 
          value={scale[0]} 
          onChange={(v) => onChange({ scale: [v, scale[1], scale[2]] })}
          step={0.1}
          min={0.1}
        />
        <NumberInput 
          value={scale[1]} 
          onChange={(v) => onChange({ scale: [scale[0], v, scale[2]] })}
          step={0.1}
          min={0.1}
        />
        <NumberInput 
          value={scale[2]} 
          onChange={(v) => onChange({ scale: [scale[0], scale[1], v] })}
          step={0.1}
          min={0.1}
        />
      </Row>
    </>
  );
}

function AnimationControls({ item, onChange }) {
  const time = item.time || 0;
  const easing = item.easing || 'linear';
  
  return (
    <>
      <Row label="Time (s)">
        <NumberInput 
          value={time} 
          onChange={(v) => onChange({ time: v })}
          step={0.1}
          min={0}
        />
      </Row>
      
      <Row label="Easing">
        <select 
          className={styles.snapInput} 
          value={easing} 
          onChange={(e) => onChange({ easing: e.target.value })}
        >
          <option value="linear">Linear</option>
          <option value="ease-in">Ease In</option>
          <option value="ease-out">Ease Out</option>
          <option value="ease-in-out">Ease In-Out</option>
          <option value="bounce">Bounce</option>
          <option value="elastic">Elastic</option>
        </select>
      </Row>
    </>
  );
}

function AudioControls({ item, onChange }) {
  const clip = item.clip || '';
  const startTime = item.startTime || 0;
  const endTime = item.endTime || 0;
  const volume = item.volume || 1;
  const loop = item.loop || false;
  
  return (
    <>
      <Row label="File">
        <input 
          className={styles.snapInput} 
          value={clip} 
          onChange={(e) => onChange({ clip: e.target.value })}
          placeholder="audio file name"
        />
      </Row>
      
      <Row label="Start/End (s)">
        <NumberInput 
          value={startTime} 
          onChange={(v) => onChange({ startTime: v })}
          step={0.1}
          min={0}
        />
        <NumberInput 
          value={endTime} 
          onChange={(v) => onChange({ endTime: v })}
          step={0.1}
          min={0}
        />
      </Row>
      
      <Row label="Volume">
        <input 
          type="range" 
          min={0} 
          max={1} 
          step={0.01} 
          value={volume} 
          onChange={(e) => onChange({ volume: Number(e.target.value) })}
          style={{ flex: 1, margin: '0 8px' }}
        />
        <span style={{ minWidth: '40px', textAlign: 'right' }}>
          {(volume * 100).toFixed(0)}%
        </span>
      </Row>
      
      <Row label="Loop">
        <input 
          type="checkbox" 
          checked={loop} 
          onChange={(e) => onChange({ loop: e.target.checked })}
        />
      </Row>
    </>
  );
}

function VideoControls({ item, onChange }) {
  const opacity = item.opacity || 1;
  const blendMode = item.blendMode || 'normal';
  const playbackRate = item.playbackRate || 1;
  
  return (
    <>
      <Row label="Opacity">
        <input 
          type="range" 
          min={0} 
          max={1} 
          step={0.01} 
          value={opacity} 
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
          style={{ flex: 1, margin: '0 8px' }}
        />
        <span style={{ minWidth: '40px', textAlign: 'right' }}>
          {(opacity * 100).toFixed(0)}%
        </span>
      </Row>
      
      <Row label="Blend Mode">
        <select 
          className={styles.snapInput} 
          value={blendMode} 
          onChange={(e) => onChange({ blendMode: e.target.value })}
        >
          <option value="normal">Normal</option>
          <option value="screen">Screen</option>
          <option value="multiply">Multiply</option>
          <option value="overlay">Overlay</option>
          <option value="soft-light">Soft Light</option>
        </select>
      </Row>
      
      <Row label="Playback Rate">
        <NumberInput 
          value={playbackRate} 
          onChange={(v) => onChange({ playbackRate: v })}
          step={0.1}
          min={0.1}
          max={5}
        />
      </Row>
    </>
  );
}

function EffectControls({ item, onChange }) {
  const effect = item.effect || 'bloom';
  const intensity = item.intensity || 0.5;
  const duration = item.duration || 1;
  
  return (
    <>
      <Row label="Type">
        <select 
          className={styles.snapInput} 
          value={effect} 
          onChange={(e) => onChange({ effect: e.target.value })}
        >
          <option value="bloom">Bloom</option>
          <option value="glow">Glow</option>
          <option value="shake">Shake</option>
          <option value="blur">Blur</option>
          <option value="chromatic">Chromatic Aberration</option>
        </select>
      </Row>
      
      <Row label="Intensity">
        <input 
          type="range" 
          min={0} 
          max={1} 
          step={0.01} 
          value={intensity} 
          onChange={(e) => onChange({ intensity: Number(e.target.value) })}
          style={{ flex: 1, margin: '0 8px' }}
        />
        <span style={{ minWidth: '40px', textAlign: 'right' }}>
          {(intensity * 100).toFixed(0)}%
        </span>
      </Row>
      
      <Row label="Duration (s)">
        <NumberInput 
          value={duration} 
          onChange={(v) => onChange({ duration: v })}
          step={0.1}
          min={0.1}
        />
      </Row>
    </>
  );
}

function Row({ label, children }) {
  return (
    <div className={styles.inputRow}>
      <label style={{ minWidth: '100px', fontSize: '0.9rem' }}>{label}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

function NumberInput({ value, onChange, step = 0.1, min, max, ...props }) {
  return (
    <input
      type="number"
      className={styles.snapInput}
      value={Number(value ?? 0)}
      onChange={(e) => onChange(Number(e.target.value))}
      step={step}
      min={min}
      max={max}
      style={{ width: '80px' }}
      {...props}
    />
  );
}
