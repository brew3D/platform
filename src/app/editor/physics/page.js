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
  FiBox, FiCircle, FiSquare, FiZap, FiSettings, FiPlay, FiPause,
  FiPlus, FiMinus, FiCopy, FiTrash2, FiSave, FiDownload,
  FiUpload, FiRefreshCw, FiChevronDown, FiChevronRight,
  FiX, FiCheck, FiAlertCircle, FiInfo, FiHelpCircle,
  FiMove, FiRotateCw, FiMaximize2, FiTarget, FiCpu
} from "react-icons/fi";

// Physics Objects Component
function PhysicsObject({ object, onSelect, isSelected, onUpdate }) {
  const { id, type, position, rotation, scale, mass, friction, restitution, constraints } = object;
  
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(id);
  };

  const geom = type === "sphere" ? (
    <sphereGeometry args={[scale?.[0] || 0.5, 32, 32]} />
  ) : type === "cylinder" ? (
    <cylinderGeometry args={[scale?.[0] || 0.25, scale?.[0] || 0.25, scale?.[1] || 1, 32]} />
  ) : type === "capsule" ? (
    <capsuleGeometry args={[scale?.[0] || 0.25, scale?.[1] || 1]} />
  ) : (
    <boxGeometry args={[scale?.[0] || 1, scale?.[1] || 1, scale?.[2] || 1]} />
  );

  return (
    <mesh
      position={position || [0, 0, 0]}
      rotation={rotation || [0, 0, 0]}
      onClick={handleClick}
      castShadow
      receiveShadow
    >
      {geom}
      <meshStandardMaterial 
        color={isSelected ? "#667eea" : "#888888"}
        wireframe={isSelected}
        transparent={isSelected}
        opacity={isSelected ? 0.8 : 1}
      />
    </mesh>
  );
}

// Physics Toolbox Component
function PhysicsToolbox({ onAddObject, onAddParticleSystem }) {
  const [expandedSections, setExpandedSections] = useState({
    rigidBodies: true,
    colliders: true,
    particles: true,
    cloth: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const rigidBodyTypes = [
    { type: "box", label: "Box", icon: FiBox },
    { type: "sphere", label: "Sphere", icon: FiCircle },
    { type: "cylinder", label: "Cylinder", icon: FiTarget },
    { type: "capsule", label: "Capsule", icon: FiTarget }
  ];

  const colliderTypes = [
    { type: "box", label: "Box Collider", icon: FiBox },
    { type: "sphere", label: "Sphere Collider", icon: FiCircle },
    { type: "capsule", label: "Capsule Collider", icon: FiTarget },
    { type: "mesh", label: "Mesh Collider", icon: FiCpu }
  ];

  const particleTypes = [
    { type: "fire", label: "Fire", icon: FiZap },
    { type: "smoke", label: "Smoke", icon: FiZap },
    { type: "rain", label: "Rain", icon: FiZap },
    { type: "explosion", label: "Explosion", icon: FiZap }
  ];

  return (
    <div className={styles.leftColumn}>
      <div className={styles.panelHeader}>
        <h3>Physics Toolbox</h3>
      </div>
      
      <div className={styles.toolboxContent}>
        {/* Rigid Bodies */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('rigidBodies')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.rigidBodies ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Rigid Bodies
          </button>
          {expandedSections.rigidBodies && (
            <div className={styles.toolboxItems}>
              {rigidBodyTypes.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddObject(type)}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Colliders */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('colliders')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.colliders ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Colliders
          </button>
          {expandedSections.colliders && (
            <div className={styles.toolboxItems}>
              {colliderTypes.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddObject(type, 'collider')}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Particle Systems */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('particles')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.particles ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Particle Systems
          </button>
          {expandedSections.particles && (
            <div className={styles.toolboxItems}>
              {particleTypes.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  className={styles.toolboxItem}
                  onClick={() => onAddParticleSystem(type)}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cloth/Soft Body */}
        <div className={styles.toolboxSection}>
          <button 
            className={styles.toolboxSectionHeader}
            onClick={() => toggleSection('cloth')}
          >
            <FiChevronRight 
              size={16} 
              style={{ 
                transform: expandedSections.cloth ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
            Cloth/Soft Body
          </button>
          {expandedSections.cloth && (
            <div className={styles.toolboxItems}>
              <button
                className={styles.toolboxItem}
                onClick={() => onAddObject('cloth')}
              >
                <FiSquare size={16} />
                Cloth
              </button>
              <button
                className={styles.toolboxItem}
                onClick={() => onAddObject('softbody')}
              >
                <FiTarget size={16} />
                Soft Body
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Physics Inspector Component
function PhysicsInspector({ selectedObject, onUpdate, onDelete }) {
  if (!selectedObject) {
    return (
      <div className={styles.rightColumn}>
        <div className={styles.panelHeader}>
          <h3>Physics Inspector</h3>
        </div>
        <div className={styles.inspectorContent}>
          <p style={{ color: 'var(--editor-text-secondary)', textAlign: 'center', padding: '2rem' }}>
            Select an object to view its physics properties
          </p>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property, value) => {
    onUpdate(selectedObject.id, property, value);
  };

  return (
    <div className={styles.rightColumn}>
      <div className={styles.panelHeader}>
        <h3>Physics Inspector</h3>
        <button 
          className={styles.deleteBtn}
          onClick={() => onDelete(selectedObject.id)}
          title="Delete Object"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
      
      <div className={styles.inspectorContent}>
        {/* Basic Properties */}
        <div className={styles.inspectorSection}>
          <h4>Basic Properties</h4>
          
          <div className={styles.propertyGroup}>
            <label>Mass</label>
            <input
              type="number"
              value={selectedObject.mass || 1}
              onChange={(e) => handlePropertyChange('mass', parseFloat(e.target.value) || 0)}
              className={styles.propertyInput}
              step="0.1"
              min="0"
            />
          </div>

          <div className={styles.propertyGroup}>
            <label>Friction</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedObject.friction || 0.5}
              onChange={(e) => handlePropertyChange('friction', parseFloat(e.target.value))}
              className={styles.propertySlider}
            />
            <span className={styles.propertyValue}>{(selectedObject.friction || 0.5).toFixed(2)}</span>
          </div>

          <div className={styles.propertyGroup}>
            <label>Restitution (Bounce)</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedObject.restitution || 0.3}
              onChange={(e) => handlePropertyChange('restitution', parseFloat(e.target.value))}
              className={styles.propertySlider}
            />
            <span className={styles.propertyValue}>{(selectedObject.restitution || 0.3).toFixed(2)}</span>
          </div>
        </div>

        {/* Gravity */}
        <div className={styles.inspectorSection}>
          <h4>Gravity</h4>
          <div className={styles.propertyGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedObject.gravity !== false}
                onChange={(e) => handlePropertyChange('gravity', e.target.checked)}
                className={styles.checkbox}
              />
              <span>Affected by Gravity</span>
            </label>
          </div>
        </div>

        {/* Constraints */}
        <div className={styles.inspectorSection}>
          <h4>Constraints</h4>
          
          <div className={styles.propertyGroup}>
            <label>Position Lock</label>
            <div className={styles.constraintGroup}>
              {['X', 'Y', 'Z'].map(axis => (
                <label key={axis} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedObject.constraints?.position?.[axis.toLowerCase()] || false}
                    onChange={(e) => {
                      const constraints = selectedObject.constraints || {};
                      const position = constraints.position || {};
                      handlePropertyChange('constraints', {
                        ...constraints,
                        position: { ...position, [axis.toLowerCase()]: e.target.checked }
                      });
                    }}
                    className={styles.checkbox}
                  />
                  <span>{axis}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.propertyGroup}>
            <label>Rotation Lock</label>
            <div className={styles.constraintGroup}>
              {['X', 'Y', 'Z'].map(axis => (
                <label key={axis} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedObject.constraints?.rotation?.[axis.toLowerCase()] || false}
                    onChange={(e) => {
                      const constraints = selectedObject.constraints || {};
                      const rotation = constraints.rotation || {};
                      handlePropertyChange('constraints', {
                        ...constraints,
                        rotation: { ...rotation, [axis.toLowerCase()]: e.target.checked }
                      });
                    }}
                    className={styles.checkbox}
                  />
                  <span>{axis}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

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
                  value={selectedObject.position?.[axis.toLowerCase() === 'x' ? 0 : axis.toLowerCase() === 'y' ? 1 : 2] || 0}
                  onChange={(e) => {
                    const newPosition = [...(selectedObject.position || [0, 0, 0])];
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
                  value={selectedObject.rotation?.[axis.toLowerCase() === 'x' ? 0 : axis.toLowerCase() === 'y' ? 1 : 2] || 0}
                  onChange={(e) => {
                    const newRotation = [...(selectedObject.rotation || [0, 0, 0])];
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

          <div className={styles.propertyGroup}>
            <label>Scale</label>
            <div className={styles.vectorInput}>
              {['X', 'Y', 'Z'].map(axis => (
                <input
                  key={axis}
                  type="number"
                  value={selectedObject.scale?.[axis.toLowerCase() === 'x' ? 0 : axis.toLowerCase() === 'y' ? 1 : 2] || 1}
                  onChange={(e) => {
                    const newScale = [...(selectedObject.scale || [1, 1, 1])];
                    const index = axis.toLowerCase() === 'x' ? 0 : axis.toLowerCase() === 'y' ? 1 : 2;
                    newScale[index] = parseFloat(e.target.value) || 1;
                    handlePropertyChange('scale', newScale);
                  }}
                  className={styles.propertyInput}
                  step="0.1"
                  min="0.1"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Physics Editor Component
export default function PhysicsEditor() {
  const [physicsObjects, setPhysicsObjects] = useState([]);
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [gravity, setGravity] = useState(true);
  const [showWireframes, setShowWireframes] = useState(true);

  const selectedObject = physicsObjects.find(obj => obj.id === selectedObjectId);

  const addObject = useCallback((type, category = 'rigidbody') => {
    const id = `${type}-${Date.now()}`;
    const newObject = {
      id,
      type,
      category,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: type === 'sphere' ? [1, 1, 1] : [1, 1, 1],
      mass: 1,
      friction: 0.5,
      restitution: 0.3,
      gravity: true,
      constraints: {
        position: { x: false, y: false, z: false },
        rotation: { x: false, y: false, z: false }
      }
    };
    
    setPhysicsObjects(prev => [...prev, newObject]);
    setSelectedObjectId(id);
  }, []);

  const addParticleSystem = useCallback((type) => {
    const id = `particle-${type}-${Date.now()}`;
    const newParticleSystem = {
      id,
      type: 'particle',
      particleType: type,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      intensity: 100,
      lifetime: 5,
      speed: 1,
      color: type === 'fire' ? '#ff6b35' : type === 'smoke' ? '#666666' : '#4a90e2'
    };
    
    setPhysicsObjects(prev => [...prev, newParticleSystem]);
    setSelectedObjectId(id);
  }, []);

  const updateObject = useCallback((id, property, value) => {
    setPhysicsObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, [property]: value } : obj
    ));
  }, []);

  const deleteObject = useCallback((id) => {
    setPhysicsObjects(prev => prev.filter(obj => obj.id !== id));
    if (selectedObjectId === id) {
      setSelectedObjectId(null);
    }
  }, [selectedObjectId]);

  const toggleSimulation = useCallback(() => {
    setIsSimulating(prev => !prev);
  }, []);

  const clearScene = useCallback(() => {
    setPhysicsObjects([]);
    setSelectedObjectId(null);
  }, []);

  return (
    <div className={styles.editorContainer}>
      <Topbar />
      <EditorTabs />

      {/* Physics Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${isSimulating ? styles.active : ''}`}
            onClick={toggleSimulation}
            title="Toggle Physics Simulation"
          >
            {isSimulating ? <FiPause /> : <FiPlay />}
            {isSimulating ? 'Pause' : 'Simulate'}
          </button>
          
          <button 
            className={`${styles.toolbarBtn} ${gravity ? styles.active : ''}`}
            onClick={() => setGravity(!gravity)}
            title="Toggle Gravity"
          >
            <FiZap />
            Gravity
          </button>
          
          <button 
            className={`${styles.toolbarBtn} ${showWireframes ? styles.active : ''}`}
            onClick={() => setShowWireframes(!showWireframes)}
            title="Toggle Wireframes"
          >
            <FiTarget />
            Wireframes
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
            Save Physics
          </button>
          <button className={styles.actionBtn}>
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout} style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
        {/* Physics Toolbox */}
        <PhysicsToolbox 
          onAddObject={addObject}
          onAddParticleSystem={addParticleSystem}
        />

        {/* Center Workspace */}
        <div className={styles.centerWorkspace}>
          <div className={styles.viewportContainer}>
            <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
              <PerspectiveCamera makeDefault position={[5, 5, 5]} />
              <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
              
              <Environment preset="sunset" />
              <Sky sunPosition={[0, 1, 0]} />
              
              <ambientLight intensity={0.4} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              
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
              
              {physicsObjects.map((object) => (
                <PhysicsObject
                  key={object.id}
                  object={object}
                  onSelect={setSelectedObjectId}
                  isSelected={selectedObjectId === object.id}
                  onUpdate={updateObject}
                />
              ))}
              
              {selectedObject && (
                <TransformControls
                  object={selectedObject}
                  mode="translate"
                  onObjectChange={(e) => {
                    if (e.target.object) {
                      updateObject(selectedObject.id, 'position', e.target.object.position.toArray());
                      updateObject(selectedObject.id, 'rotation', e.target.object.rotation.toArray());
                      updateObject(selectedObject.id, 'scale', e.target.object.scale.toArray());
                    }
                  }}
                />
              )}
            </Canvas>
          </div>
        </div>

        {/* Physics Inspector */}
        <PhysicsInspector
          selectedObject={selectedObject}
          onUpdate={updateObject}
          onDelete={deleteObject}
        />
      </div>
    </div>
  );
}
