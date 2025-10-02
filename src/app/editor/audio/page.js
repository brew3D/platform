"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import styles from "../editor.module.css";
import Topbar from "../../Topbar";
import EditorTabs from "../../components/EditorTabs";
import { 
  FiVolume2, FiVolumeX, FiPlay, FiPause, FiStopCircle, FiSkipBack, FiSkipForward,
  FiPlus, FiMinus, FiCopy, FiTrash2, FiSave, FiDownload,
  FiUpload, FiRefreshCw, FiChevronDown, FiChevronRight,
  FiX, FiCheck, FiAlertCircle, FiInfo, FiHelpCircle,
  FiMusic, FiMic, FiHeadphones, FiSettings, FiActivity,
  FiUpload as FiUploadIcon, FiRotateCw, FiTarget, FiZap
} from "react-icons/fi";
import { PiWaveform } from "react-icons/pi";

// Audio Track Component
function AudioTrack({ track, onSelect, isSelected, onUpdate, onDelete, isPlaying, currentTime }) {
  const { id, name, type, volume, loop, position, duration, effects, is3D, radius } = track;
  
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(id);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className={`${styles.audioTrack} ${isSelected ? styles.selected : ''}`}
      onClick={handleClick}
    >
      <div className={styles.trackHeader}>
        <div className={styles.trackInfo}>
          <div className={styles.trackIcon}>
            {type === 'music' && <FiMusic size={16} />}
            {type === 'sfx' && <FiZap size={16} />}
            {type === 'voice' && <FiMic size={16} />}
          </div>
          <div className={styles.trackDetails}>
            <h4>{name}</h4>
            <span className={styles.trackType}>{type.toUpperCase()}</span>
          </div>
        </div>
        <div className={styles.trackControls}>
          <button 
            className={styles.trackBtn}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(id, 'volume', Math.max(0, volume - 0.1));
            }}
          >
            <FiMinus size={12} />
          </button>
          <span className={styles.volumeDisplay}>{(volume * 100).toFixed(0)}%</span>
          <button 
            className={styles.trackBtn}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(id, 'volume', Math.min(1, volume + 0.1));
            }}
          >
            <FiPlus size={12} />
          </button>
          <button 
            className={styles.trackBtn}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
          >
            <FiTrash2 size={12} />
          </button>
        </div>
      </div>
      
      <div className={styles.trackTimeline}>
        <div className={styles.trackProgress} style={{ width: `${progress}%` }} />
        <div className={styles.trackWaveform}>
          {/* Waveform visualization would go here */}
          <div className={styles.waveformPlaceholder}>
            <PiWaveform size={20} />
          </div>
        </div>
      </div>
      
      <div className={styles.trackProperties}>
        <div className={styles.propertyRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => onUpdate(id, 'loop', e.target.checked)}
              className={styles.checkbox}
            />
            <span>Loop</span>
          </label>
          
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={is3D}
              onChange={(e) => onUpdate(id, 'is3D', e.target.checked)}
              className={styles.checkbox}
            />
            <span>3D Audio</span>
          </label>
        </div>
        
        {is3D && (
          <div className={styles.propertyRow}>
            <label>Radius</label>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={radius || 10}
              onChange={(e) => onUpdate(id, 'radius', parseFloat(e.target.value))}
              className={styles.propertySlider}
            />
            <span className={styles.propertyValue}>{radius || 10}m</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Audio Toolbox Component
function AudioToolbox({ onAddTrack, onAddEffect }) {
  const [expandedSections, setExpandedSections] = useState({
    tracks: true,
    effects: true,
    presets: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const trackTypes = [
    { type: "music", label: "Background Music", icon: FiMusic, description: "Ambient music tracks" },
    { type: "sfx", label: "Sound Effects", icon: FiZap, description: "Game sound effects" },
    { type: "voice", label: "Voice Track", icon: FiMic, description: "Voice acting or narration" }
  ];

  const effects = [
    { type: "reverb", label: "Reverb", icon: FiActivity },
    { type: "echo", label: "Echo", icon: FiRotateCw },
    { type: "distortion", label: "Distortion", icon: FiZap },
    { type: "lowpass", label: "Low Pass", icon: FiActivity },
    { type: "highpass", label: "High Pass", icon: FiActivity }
  ];

  const presets = [
    { name: "Ambient Forest", description: "Nature sounds and ambient music" },
    { name: "Urban City", description: "City sounds and traffic" },
    { name: "Sci-Fi", description: "Futuristic sound effects" },
    { name: "Horror", description: "Dark and eerie atmosphere" }
  ];

  return (
    <div className={styles.leftColumn}>
      <div className={styles.panelHeader}>
        <h3>Audio Toolbox</h3>
      </div>
      
      <div className={styles.toolboxContent}>
        {/* Audio Tracks */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('tracks')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.tracks ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Audio Tracks
          </button>
          {expandedSections.tracks && (
            <div className={styles.toolboxItems}>
              {trackTypes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddTrack(type)}
                  title={description}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Effects */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('effects')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.effects ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Audio Effects
          </button>
          {expandedSections.effects && (
            <div className={styles.toolboxItems}>
              {effects.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddEffect(type)}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Presets */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('presets')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.presets ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Presets
          </button>
          {expandedSections.presets && (
            <div className={styles.toolboxItems}>
              {presets.map(({ name, description }) => (
                <button
                  key={name}
                  className={styles.toolboxItem}
                  onClick={() => onAddTrack('preset', name)}
                  title={description}
                >
                  <FiSettings size={16} />
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File Upload */}
        <div className={styles.toolboxSection}>
          <div className={styles.uploadArea}>
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={(e) => {
                Array.from(e.target.files).forEach(file => {
                  onAddTrack('upload', file);
                });
              }}
              style={{ display: 'none' }}
              id="audio-upload"
            />
            <label htmlFor="audio-upload" className={styles.uploadButton}>
              <FiUploadIcon size={16} />
              Upload Audio Files
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Audio Inspector Component
function AudioInspector({ selectedTrack, onUpdate, onDelete, mixerSettings, onMixerUpdate }) {
  if (!selectedTrack) {
    return (
      <div className={styles.rightColumn}>
        <div className={styles.panelHeader}>
          <h3>Audio Inspector</h3>
        </div>
        <div className={styles.inspectorContent}>
          <p style={{ color: 'var(--editor-text-secondary)', textAlign: 'center', padding: '2rem' }}>
            Select an audio track to view its properties
          </p>
          
          {/* Mixer Panel */}
          <div className={styles.inspectorSection}>
            <h4>Mixer</h4>
            <div className={styles.mixerPanel}>
              <div className={styles.mixerChannel}>
                <label>Music</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mixerSettings.music}
                  onChange={(e) => onMixerUpdate('music', parseFloat(e.target.value))}
                  className={styles.mixerSlider}
                />
                <span className={styles.mixerValue}>{(mixerSettings.music * 100).toFixed(0)}%</span>
              </div>
              
              <div className={styles.mixerChannel}>
                <label>SFX</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mixerSettings.sfx}
                  onChange={(e) => onMixerUpdate('sfx', parseFloat(e.target.value))}
                  className={styles.mixerSlider}
                />
                <span className={styles.mixerValue}>{(mixerSettings.sfx * 100).toFixed(0)}%</span>
              </div>
              
              <div className={styles.mixerChannel}>
                <label>Voice</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mixerSettings.voice}
                  onChange={(e) => onMixerUpdate('voice', parseFloat(e.target.value))}
                  className={styles.mixerSlider}
                />
                <span className={styles.mixerValue}>{(mixerSettings.voice * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property, value) => {
    onUpdate(selectedTrack.id, property, value);
  };

  return (
    <div className={styles.rightColumn}>
      <div className={styles.panelHeader}>
        <h3>Audio Inspector</h3>
        <button 
          className={styles.deleteBtn}
          onClick={() => onDelete(selectedTrack.id)}
          title="Delete Track"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
      
      <div className={styles.inspectorContent}>
        {/* Basic Properties */}
        <div className={styles.inspectorSection}>
          <h4>Basic Properties</h4>
          
          <div className={styles.propertyGroup}>
            <label>Name</label>
            <input
              type="text"
              value={selectedTrack.name || ''}
              onChange={(e) => handlePropertyChange('name', e.target.value)}
              className={styles.propertyInput}
            />
          </div>

          <div className={styles.propertyGroup}>
            <label>Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedTrack.volume || 1}
              onChange={(e) => handlePropertyChange('volume', parseFloat(e.target.value))}
              className={styles.propertySlider}
            />
            <span className={styles.propertyValue}>{(selectedTrack.volume * 100).toFixed(0)}%</span>
          </div>

          <div className={styles.propertyGroup}>
            <label>Duration</label>
            <input
              type="number"
              value={selectedTrack.duration || 0}
              onChange={(e) => handlePropertyChange('duration', parseFloat(e.target.value) || 0)}
              className={styles.propertyInput}
              step="0.1"
              min="0"
            />
            <span className={styles.propertyUnit}>seconds</span>
          </div>

          <div className={styles.propertyGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedTrack.loop || false}
                onChange={(e) => handlePropertyChange('loop', e.target.checked)}
                className={styles.checkbox}
              />
              <span>Loop</span>
            </label>
          </div>
        </div>

        {/* 3D Audio Properties */}
        <div className={styles.inspectorSection}>
          <h4>3D Audio</h4>
          
          <div className={styles.propertyGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedTrack.is3D || false}
                onChange={(e) => handlePropertyChange('is3D', e.target.checked)}
                className={styles.checkbox}
              />
              <span>Enable 3D Positioning</span>
            </label>
          </div>

          {selectedTrack.is3D && (
            <>
              <div className={styles.propertyGroup}>
                <label>Radius</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={selectedTrack.radius || 10}
                  onChange={(e) => handlePropertyChange('radius', parseFloat(e.target.value))}
                  className={styles.propertySlider}
                />
                <span className={styles.propertyValue}>{selectedTrack.radius || 10}m</span>
              </div>

              <div className={styles.propertyGroup}>
                <label>Position</label>
                <div className={styles.vectorInput}>
                  {['X', 'Y', 'Z'].map(axis => (
                    <input
                      key={axis}
                      type="number"
                      value={selectedTrack.position?.[axis.toLowerCase() === 'x' ? 0 : axis.toLowerCase() === 'y' ? 1 : 2] || 0}
                      onChange={(e) => {
                        const newPosition = [...(selectedTrack.position || [0, 0, 0])];
                        const index = axis.toLowerCase() === 'x' ? 0 : axis.toLowerCase() === 'y' ? 1 : 2;
                        newPosition[index] = parseFloat(e.target.value) || 0;
                        handlePropertyChange('position', newPosition);
                      }}
                      className={styles.propertyInput}
                      step="0.1"
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Audio Effects */}
        <div className={styles.inspectorSection}>
          <h4>Effects</h4>
          
          {selectedTrack.effects?.map((effect, index) => (
            <div key={index} className={styles.effectItem}>
              <div className={styles.effectHeader}>
                <span>{effect.type}</span>
                <button 
                  className={styles.effectRemove}
                  onClick={() => {
                    const newEffects = selectedTrack.effects.filter((_, i) => i !== index);
                    handlePropertyChange('effects', newEffects);
                  }}
                >
                  <FiX size={12} />
                </button>
              </div>
              
              {effect.type === 'reverb' && (
                <div className={styles.propertyGroup}>
                  <label>Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={effect.intensity || 0.5}
                    onChange={(e) => {
                      const newEffects = [...selectedTrack.effects];
                      newEffects[index] = { ...effect, intensity: parseFloat(e.target.value) };
                      handlePropertyChange('effects', newEffects);
                    }}
                    className={styles.propertySlider}
                  />
                  <span className={styles.propertyValue}>{(effect.intensity * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>
          ))}
          
          <button 
            className={styles.addEffectBtn}
            onClick={() => {
              const newEffect = { type: 'reverb', intensity: 0.5 };
              const newEffects = [...(selectedTrack.effects || []), newEffect];
              handlePropertyChange('effects', newEffects);
            }}
          >
            <FiPlus size={16} />
            Add Effect
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Audio Editor Component
export default function AudioEditor() {
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mixerSettings, setMixerSettings] = useState({
    music: 0.8,
    sfx: 1.0,
    voice: 0.9
  });

  const selectedTrack = audioTracks.find(track => track.id === selectedTrackId);

  // Playback timer
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const addTrack = useCallback((type, preset = null) => {
    const id = `track-${type}-${Date.now()}`;
    
    let newTrack = {
      id,
      name: `New ${type} Track`,
      type,
      volume: 1,
      loop: false,
      position: [0, 0, 0],
      duration: 0,
      effects: [],
      is3D: false,
      radius: 10
    };

    // Apply presets
    if (preset === 'Ambient Forest') {
      newTrack = { ...newTrack, name: 'Forest Ambience', type: 'music', volume: 0.7 };
    } else if (preset === 'Urban City') {
      newTrack = { ...newTrack, name: 'City Sounds', type: 'sfx', volume: 0.8 };
    } else if (preset === 'Sci-Fi') {
      newTrack = { ...newTrack, name: 'Sci-Fi Effects', type: 'sfx', volume: 0.9 };
    } else if (preset === 'Horror') {
      newTrack = { ...newTrack, name: 'Horror Atmosphere', type: 'music', volume: 0.6 };
    }

    // Handle file upload
    if (type === 'upload' && preset instanceof File) {
      newTrack = { 
        ...newTrack, 
        name: preset.name.replace(/\.[^/.]+$/, ""), 
        type: 'music',
        duration: 30 // Mock duration
      };
    }
    
    setAudioTracks(prev => [...prev, newTrack]);
    setSelectedTrackId(id);
  }, []);

  const addEffect = useCallback((effectType) => {
    if (selectedTrackId) {
      const newEffect = { type: effectType, intensity: 0.5 };
      setAudioTracks(prev => prev.map(track => 
        track.id === selectedTrackId 
          ? { ...track, effects: [...(track.effects || []), newEffect] }
          : track
      ));
    }
  }, [selectedTrackId]);

  const updateTrack = useCallback((id, property, value) => {
    setAudioTracks(prev => prev.map(track => 
      track.id === id ? { ...track, [property]: value } : track
    ));
  }, []);

  const deleteTrack = useCallback((id) => {
    setAudioTracks(prev => prev.filter(track => track.id !== id));
    if (selectedTrackId === id) {
      setSelectedTrackId(null);
    }
  }, [selectedTrackId]);

  const updateMixer = useCallback((channel, value) => {
    setMixerSettings(prev => ({ ...prev, [channel]: value }));
  }, []);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const clearScene = useCallback(() => {
    setAudioTracks([]);
    setSelectedTrackId(null);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  return (
    <div className={styles.editorContainer}>
      <Topbar />
      <EditorTabs />

      {/* Audio Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${isPlaying ? styles.active : ''}`}
            onClick={togglePlayback}
            title="Play/Pause"
          >
            {isPlaying ? <FiPause /> : <FiPlay />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button 
            className={styles.toolbarBtn}
            onClick={stopPlayback}
            title="Stop"
          >
            <FiStopCircle />
            Stop
          </button>
          
          <button 
            className={styles.toolbarBtn}
            onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}
            title="Skip Back 5s"
          >
            <FiSkipBack />
          </button>
          
          <button 
            className={styles.toolbarBtn}
            onClick={() => setCurrentTime(currentTime + 5)}
            title="Skip Forward 5s"
          >
            <FiSkipForward />
          </button>
        </div>
        
        <div className={styles.toolbarSection}>
          <span className={styles.timeDisplay}>
            {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}
          </span>
        </div>
        
        <div className={styles.toolbarSpacer} />
        
        <div className={styles.toolbarSection}>
          <button className={styles.actionBtn}>
            <FiSave />
            Save Audio
          </button>
          <button className={styles.actionBtn}>
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout} style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
        {/* Audio Toolbox */}
        <AudioToolbox 
          onAddTrack={addTrack}
          onAddEffect={addEffect}
        />

        {/* Center Workspace - Timeline */}
        <div className={styles.centerWorkspace}>
          <div className={styles.timelineContainer}>
            <div className={styles.timelineHeader}>
              <h3>Audio Timeline</h3>
              <div className={styles.timelineControls}>
                <button className={styles.timelineBtn}>
                  <FiSettings size={16} />
                  Settings
                </button>
              </div>
            </div>
            
            <div className={styles.timelineContent}>
              {audioTracks.length === 0 ? (
                <div className={styles.emptyTimeline}>
                  <FiHeadphones size={48} />
                  <h3>No Audio Tracks</h3>
                  <p>Add audio tracks from the toolbox to get started</p>
                </div>
              ) : (
                <div className={styles.timelineTracks}>
                  {audioTracks.map((track) => (
                    <AudioTrack
                      key={track.id}
                      track={track}
                      onSelect={setSelectedTrackId}
                      isSelected={selectedTrackId === track.id}
                      onUpdate={updateTrack}
                      onDelete={deleteTrack}
                      isPlaying={isPlaying}
                      currentTime={currentTime}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audio Inspector */}
        <AudioInspector
          selectedTrack={selectedTrack}
          onUpdate={updateTrack}
          onDelete={deleteTrack}
          mixerSettings={mixerSettings}
          onMixerUpdate={updateMixer}
        />
      </div>
    </div>
  );
}
