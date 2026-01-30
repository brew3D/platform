"use client";

import React, { useState, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  PerspectiveCamera,
  TransformControls,
  Environment,
  Sky
} from "@react-three/drei";
import styles from "../editor.module.css";
import Topbar from "../../Topbar";
import EditorTabs from "../../components/EditorTabs";
import { 
  FiSun, FiCircle, FiTarget, FiCloud, FiSettings, FiPlay, FiPause,
  FiPlus, FiMinus, FiCopy, FiTrash2, FiSave, FiDownload,
  FiUpload, FiRefreshCw, FiChevronDown, FiChevronRight,
  FiX, FiCheck, FiAlertCircle, FiInfo, FiHelpCircle,
  FiMove, FiRotateCw, FiMaximize2, FiEye, FiEyeOff,
  FiUpload as FiUploadIcon, FiClock, FiPalette
} from "react-icons/fi";

// Light Object Component
function LightObject({ light, onSelect, isSelected, onUpdate }) {
  const { id, type, position, rotation, intensity, color, castShadow, shadowResolution } = light;
  
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(id);
  };

  const lightProps = {
    position: position || [0, 0, 0],
    intensity: intensity || 1,
    color: color || "#ffffff",
    castShadow: castShadow !== false,
    shadowMapSize: shadowResolution === 'high' ? 2048 : shadowResolution === 'medium' ? 1024 : 512
  };

  return (
    <>
      {type === "directional" && (
        <directionalLight
          {...lightProps}
          onClick={handleClick}
        />
      )}
      {type === "point" && (
        <pointLight
          {...lightProps}
          distance={10}
          decay={2}
          onClick={handleClick}
        />
      )}
      {type === "spot" && (
        <spotLight
          {...lightProps}
          angle={Math.PI / 3}
          penumbra={0.1}
          distance={10}
          decay={2}
          onClick={handleClick}
        />
      )}
      
      {/* Light Gizmo */}
      <mesh position={position || [0, 0, 0]} onClick={handleClick}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial 
          color={isSelected ? '#8b5a2b' : color || "#ffffff"}
          emissive={color || "#ffffff"}
          emissiveIntensity={0.5}
        />
      </mesh>
    </>
  );
}

// Lighting Toolbox Component
function LightingToolbox({ onAddLight, onAddSkybox }) {
  const [expandedSections, setExpandedSections] = useState({
    lights: true,
    skybox: true,
    presets: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const lightTypes = [
    { type: "directional", label: "Directional Light", icon: FiSun, description: "Sun-like light" },
    { type: "point", label: "Point Light", icon: FiCircle, description: "Omnidirectional light" },
    { type: "spot", label: "Spot Light", icon: FiTarget, description: "Focused cone light" }
  ];

  const skyboxTypes = [
    { type: "sunset", label: "Sunset", icon: FiSun },
    { type: "dawn", label: "Dawn", icon: FiSun },
    { type: "night", label: "Night", icon: FiSun },
    { type: "custom", label: "Custom HDR", icon: FiUploadIcon }
  ];

  const presets = [
    { name: "Studio", description: "Professional studio lighting" },
    { name: "Outdoor", description: "Natural outdoor lighting" },
    { name: "Indoor", description: "Warm indoor lighting" },
    { name: "Dramatic", description: "High contrast dramatic lighting" }
  ];

  return (
    <div className={styles.leftColumn}>
      <div className={styles.panelHeader}>
        <h3>Lighting Toolbox</h3>
      </div>
      
      <div className={styles.toolboxContent}>
        {/* Lights */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('lights')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.lights ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Lights
          </button>
          {expandedSections.lights && (
            <div className={styles.toolboxItems}>
              {lightTypes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddLight(type)}
                  title={description}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Skybox */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('skybox')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.skybox ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Skybox
          </button>
          {expandedSections.skybox && (
            <div className={styles.toolboxItems}>
              {skyboxTypes.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddSkybox(type)}
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
                  onClick={() => onAddLight('preset', name)}
                  title={description}
                >
                  <FiSettings size={16} />
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Lighting Inspector Component
function LightingInspector({ selectedLight, onUpdate, onDelete, dayNightCycle, onDayNightChange }) {
  if (!selectedLight) {
    return (
      <div className={styles.rightColumn}>
        <div className={styles.panelHeader}>
          <h3>Lighting Inspector</h3>
        </div>
        <div className={styles.inspectorContent}>
          <p style={{ color: 'var(--editor-text-secondary)', textAlign: 'center', padding: '2rem' }}>
            Select a light to view its properties
          </p>
          
          {/* Day-Night Cycle */}
          <div className={styles.inspectorSection}>
            <h4>Day-Night Cycle</h4>
            <div className={styles.propertyGroup}>
              <label>Time of Day</label>
              <input
                type="range"
                min="0"
                max="24"
                step="0.1"
                value={dayNightCycle.time}
                onChange={(e) => onDayNightChange({ ...dayNightCycle, time: parseFloat(e.target.value) })}
                className={styles.propertySlider}
              />
              <span className={styles.propertyValue}>
                {Math.floor(dayNightCycle.time)}:{(dayNightCycle.time % 1 * 60).toFixed(0).padStart(2, '0')}
              </span>
            </div>
            
            <div className={styles.propertyGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={dayNightCycle.enabled}
                  onChange={(e) => onDayNightChange({ ...dayNightCycle, enabled: e.target.checked })}
                  className={styles.checkbox}
                />
                <span>Enable Day-Night Cycle</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property, value) => {
    onUpdate(selectedLight.id, property, value);
  };

  return (
    <div className={styles.rightColumn}>
      <div className={styles.panelHeader}>
        <h3>Lighting Inspector</h3>
        <button 
          className={styles.deleteBtn}
          onClick={() => onDelete(selectedLight.id)}
          title="Delete Light"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
      
      <div className={styles.inspectorContent}>
        {/* Basic Properties */}
        <div className={styles.inspectorSection}>
          <h4>Basic Properties</h4>
          
          <div className={styles.propertyGroup}>
            <label>Intensity</label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={selectedLight.intensity || 1}
              onChange={(e) => handlePropertyChange('intensity', parseFloat(e.target.value))}
              className={styles.propertySlider}
            />
            <span className={styles.propertyValue}>{(selectedLight.intensity || 1).toFixed(1)}</span>
          </div>

          <div className={styles.propertyGroup}>
            <label>Color</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={selectedLight.color || "#ffffff"}
                onChange={(e) => handlePropertyChange('color', e.target.value)}
                className={styles.colorInput}
              />
              <input
                type="text"
                value={selectedLight.color || "#ffffff"}
                onChange={(e) => handlePropertyChange('color', e.target.value)}
                className={styles.propertyInput}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className={styles.propertyGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedLight.castShadow !== false}
                onChange={(e) => handlePropertyChange('castShadow', e.target.checked)}
                className={styles.checkbox}
              />
              <span>Cast Shadows</span>
            </label>
          </div>
        </div>

        {/* Shadow Properties */}
        {selectedLight.castShadow !== false && (
          <div className={styles.inspectorSection}>
            <h4>Shadow Properties</h4>
            
            <div className={styles.propertyGroup}>
              <label>Shadow Type</label>
              <select
                value={selectedLight.shadowType || 'realtime'}
                onChange={(e) => handlePropertyChange('shadowType', e.target.value)}
                className={styles.propertySelect}
              >
                <option value="realtime">Real-time</option>
                <option value="baked">Baked</option>
              </select>
            </div>

            <div className={styles.propertyGroup}>
              <label>Resolution</label>
              <select
                value={selectedLight.shadowResolution || 'medium'}
                onChange={(e) => handlePropertyChange('shadowResolution', e.target.value)}
                className={styles.propertySelect}
              >
                <option value="low">Low (512px)</option>
                <option value="medium">Medium (1024px)</option>
                <option value="high">High (2048px)</option>
              </select>
            </div>

            <div className={styles.propertyGroup}>
              <label>Softness</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedLight.shadowSoftness || 0.5}
                onChange={(e) => handlePropertyChange('shadowSoftness', parseFloat(e.target.value))}
                className={styles.propertySlider}
              />
              <span className={styles.propertyValue}>{(selectedLight.shadowSoftness || 0.5).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Spot Light Specific */}
        {selectedLight.type === 'spot' && (
          <div className={styles.inspectorSection}>
            <h4>Spot Light Properties</h4>
            
            <div className={styles.propertyGroup}>
              <label>Angle</label>
              <input
                type="range"
                min="0"
                max="90"
                step="1"
                value={selectedLight.angle || 60}
                onChange={(e) => handlePropertyChange('angle', parseFloat(e.target.value))}
                className={styles.propertySlider}
              />
              <span className={styles.propertyValue}>{(selectedLight.angle || 60).toFixed(0)}°</span>
            </div>

            <div className={styles.propertyGroup}>
              <label>Penumbra</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedLight.penumbra || 0.1}
                onChange={(e) => handlePropertyChange('penumbra', parseFloat(e.target.value))}
                className={styles.propertySlider}
              />
              <span className={styles.propertyValue}>{(selectedLight.penumbra || 0.1).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Transform */}
        <div className={styles.inspectorSection}>
          <h4>Transform</h4>
          
          <div className={styles.propertyGroup}>
            <label>Position</label>
            <div className={styles.vectorInput}>
              {['X', 'Y', 'Z'].map(axis => (
                <input
                  key={axis}
                  type="number"
                  value={selectedLight.position?.[axis.toLowerCase() === 'x' ? 0 : axis.toLowerCase() === 'y' ? 1 : 2] || 0}
                  onChange={(e) => {
                    const newPosition = [...(selectedLight.position || [0, 0, 0])];
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

          <div className={styles.propertyGroup}>
            <label>Rotation</label>
            <div className={styles.vectorInput}>
              {['X', 'Y', 'Z'].map(axis => (
                <input
                  key={axis}
                  type="number"
                  value={selectedLight.rotation?.[axis.toLowerCase() === 'x' ? 0 : axis.toLowerCase() === 'y' ? 1 : 2] || 0}
                  onChange={(e) => {
                    const newRotation = [...(selectedLight.rotation || [0, 0, 0])];
                    const index = axis.toLowerCase() === 'x' ? 0 : axis.toLowerCase() === 'y' ? 1 : 2;
                    newRotation[index] = parseFloat(e.target.value) || 0;
                    handlePropertyChange('rotation', newRotation);
                  }}
                  className={styles.propertyInput}
                  step="0.1"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Lighting Editor Component
export default function LightingEditor() {
  const [lights, setLights] = useState([]);
  const [selectedLightId, setSelectedLightId] = useState(null);
  const [shadowsEnabled, setShadowsEnabled] = useState(true);
  const [dayNightCycle, setDayNightCycle] = useState({
    enabled: false,
    time: 12.0 // 12:00 PM
  });

  const selectedLight = lights.find(light => light.id === selectedLightId);

  const addLight = useCallback((type, preset = null) => {
    const id = `light-${type}-${Date.now()}`;
    
    let newLight = {
      id,
      type,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      intensity: 1,
      color: "#ffffff",
      castShadow: true,
      shadowType: 'realtime',
      shadowResolution: 'medium',
      shadowSoftness: 0.5
    };

    // Apply presets
    if (preset === 'Studio') {
      newLight = { ...newLight, intensity: 2, color: "#ffffff", position: [5, 5, 5] };
    } else if (preset === 'Outdoor') {
      newLight = { ...newLight, intensity: 3, color: "#ffeb3b", position: [10, 10, 5] };
    } else if (preset === 'Indoor') {
      newLight = { ...newLight, intensity: 1.5, color: "#ff9800", position: [2, 3, 2] };
    } else if (preset === 'Dramatic') {
      newLight = { ...newLight, intensity: 4, color: "#e91e63", position: [0, 8, 0] };
    }

    // Set default positions based on type
    if (type === 'directional') {
      newLight.position = [5, 5, 5];
    } else if (type === 'point') {
      newLight.position = [2, 2, 2];
    } else if (type === 'spot') {
      newLight.position = [3, 3, 3];
      newLight.angle = 60;
      newLight.penumbra = 0.1;
    }
    
    setLights(prev => [...prev, newLight]);
    setSelectedLightId(id);
  }, []);

  const addSkybox = useCallback((type) => {
    if (type === 'custom') {
      // Handle custom HDR upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.hdr,.exr';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          console.log('Uploading HDR file:', file.name);
          // Handle HDR upload logic here
        }
      };
      input.click();
    } else {
      // Apply skybox preset
      console.log('Applying skybox:', type);
    }
  }, []);

  const updateLight = useCallback((id, property, value) => {
    setLights(prev => prev.map(light => 
      light.id === id ? { ...light, [property]: value } : light
    ));
  }, []);

  const deleteLight = useCallback((id) => {
    setLights(prev => prev.filter(light => light.id !== id));
    if (selectedLightId === id) {
      setSelectedLightId(null);
    }
  }, [selectedLightId]);

  const clearScene = useCallback(() => {
    setLights([]);
    setSelectedLightId(null);
  }, []);

  return (
    <div className={styles.editorContainer}>
      <Topbar />
      <EditorTabs />

      {/* Lighting Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${shadowsEnabled ? styles.active : ''}`}
            onClick={() => setShadowsEnabled(!shadowsEnabled)}
            title="Toggle Shadows"
          >
            {shadowsEnabled ? <FiEye /> : <FiEyeOff />}
            Shadows
          </button>
          
          <button 
            className={`${styles.toolbarBtn} ${dayNightCycle.enabled ? styles.active : ''}`}
            onClick={() => setDayNightCycle(prev => ({ ...prev, enabled: !prev.enabled }))}
            title="Toggle Day-Night Cycle"
          >
            <FiClock />
            Day-Night
          </button>
        </div>
        
        <div className={styles.toolbarSection}>
          <button className={styles.toolbarBtn} onClick={clearScene}>
            <FiTrash2 />
            Clear Scene
          </button>
        </div>
        
        <div className={styles.toolbarSpacer} />
        
        <div className={styles.toolbarSection}>
          <button className={styles.actionBtn}>
            <FiSave />
            Save Lighting
          </button>
          <button className={styles.actionBtn}>
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout} style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
        {/* Lighting Toolbox */}
        <LightingToolbox 
          onAddLight={addLight}
          onAddSkybox={addSkybox}
        />

        {/* Center Workspace */}
        <div className={styles.centerWorkspace}>
          <div className={styles.viewportContainer}>
            <Canvas shadows={shadowsEnabled} camera={{ position: [5, 5, 5], fov: 50 }}>
              <PerspectiveCamera makeDefault position={[5, 5, 5]} />
              <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
              
              <Environment preset={dayNightCycle.enabled ? "sunset" : "sunset"} />
              <Sky sunPosition={[0, 1, 0]} />
              
              <ambientLight intensity={0.2} />
              
              {lights.map((light) => (
                <LightObject
                  key={light.id}
                  light={light}
                  onSelect={setSelectedLightId}
                  isSelected={selectedLightId === light.id}
                  onUpdate={updateLight}
                />
              ))}
              
              <Grid 
                position={[0, -0.01, 0]} 
                args={[10, 10]} 
                cellSize={1} 
                cellThickness={0.5} 
                cellColor="#6f6f6f"
                sectionSize={3} 
                sectionThickness={1} 
                sectionColor="#9d4edd"
                fadeDistance={30} 
                fadeStrength={1} 
                followCamera={false} 
                infiniteGrid={true} 
              />
              
              {selectedLight && (
                <TransformControls
                  object={selectedLight}
                  mode="translate"
                  onObjectChange={(e) => {
                    if (e.target.object) {
                      updateLight(selectedLight.id, 'position', e.target.object.position.toArray());
                      updateLight(selectedLight.id, 'rotation', e.target.object.rotation.toArray());
                    }
                  }}
                />
              )}
            </Canvas>
          </div>
        </div>

        {/* Lighting Inspector */}
        <LightingInspector
          selectedLight={selectedLight}
          onUpdate={updateLight}
          onDelete={deleteLight}
          dayNightCycle={dayNightCycle}
          onDayNightChange={setDayNightCycle}
        />
      </div>
    </div>
  );
}
