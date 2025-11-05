'use client';

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
  FiMove, FiRotateCw, FiMaximize2, FiTarget, FiCpu, FiGrid
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
        color={isSelected ? "#ff6b6b" : "#4ecdc4"} 
        metalness={0.1}
        roughness={0.3}
      />
    </mesh>
  );
}

// Physics Inspector Component
function PhysicsInspector({ selectedObject, onUpdate, onDelete }) {
  if (!selectedObject) {
    return (
      <div className={styles.inspector}>
        <h3>Physics Inspector</h3>
        <div className={styles.inspectorInner}>
          <p>Select an object to edit its physics properties</p>
        </div>
      </div>
    );
  }

  const { id, type, position, rotation, scale, mass, friction, restitution, constraints } = selectedObject;

  const handleUpdate = (field, value) => {
    onUpdate(id, field, value);
  };

  return (
    <div className={styles.inspector}>
      <div className={styles.inspectorHeader}>
        <h3>Physics Inspector</h3>
        <button 
          className={styles.deleteBtn}
          onClick={() => onDelete(id)}
          title="Delete Object"
        >
          <FiTrash2 />
        </button>
      </div>
      
      <div className={styles.inspectorInner}>
        <div className={styles.propertyGroup}>
          <label>Object Type</label>
          <select 
            value={type} 
            onChange={(e) => handleUpdate('type', e.target.value)}
            className={styles.propertyInput}
          >
            <option value="box">Box</option>
            <option value="sphere">Sphere</option>
            <option value="cylinder">Cylinder</option>
            <option value="capsule">Capsule</option>
          </select>
        </div>

        <div className={styles.propertyGroup}>
          <label>Position</label>
          <div className={styles.vectorInput}>
            <input
              type="number"
              value={position?.[0] || 0}
              onChange={(e) => handleUpdate('position', [(position?.[0] || 0), (position?.[1] || 0), (position?.[2] || 0)].map((v, i) => i === 0 ? parseFloat(e.target.value) || 0 : v))}
              step="0.1"
              className={styles.propertyInput}
            />
            <input
              type="number"
              value={position?.[1] || 0}
              onChange={(e) => handleUpdate('position', [(position?.[0] || 0), (position?.[1] || 0), (position?.[2] || 0)].map((v, i) => i === 1 ? parseFloat(e.target.value) || 0 : v))}
              step="0.1"
              className={styles.propertyInput}
            />
            <input
              type="number"
              value={position?.[2] || 0}
              onChange={(e) => handleUpdate('position', [(position?.[0] || 0), (position?.[1] || 0), (position?.[2] || 0)].map((v, i) => i === 2 ? parseFloat(e.target.value) || 0 : v))}
              step="0.1"
              className={styles.propertyInput}
            />
          </div>
        </div>

        <div className={styles.propertyGroup}>
          <label>Rotation</label>
          <div className={styles.vectorInput}>
            <input
              type="number"
              value={rotation?.[0] || 0}
              onChange={(e) => handleUpdate('rotation', [(rotation?.[0] || 0), (rotation?.[1] || 0), (rotation?.[2] || 0)].map((v, i) => i === 0 ? parseFloat(e.target.value) || 0 : v))}
              step="0.1"
              className={styles.propertyInput}
            />
            <input
              type="number"
              value={rotation?.[1] || 0}
              onChange={(e) => handleUpdate('rotation', [(rotation?.[0] || 0), (rotation?.[1] || 0), (rotation?.[2] || 0)].map((v, i) => i === 1 ? parseFloat(e.target.value) || 0 : v))}
              step="0.1"
              className={styles.propertyInput}
            />
            <input
              type="number"
              value={rotation?.[2] || 0}
              onChange={(e) => handleUpdate('rotation', [(rotation?.[0] || 0), (rotation?.[1] || 0), (rotation?.[2] || 0)].map((v, i) => i === 2 ? parseFloat(e.target.value) || 0 : v))}
              step="0.1"
              className={styles.propertyInput}
            />
          </div>
        </div>

        <div className={styles.propertyGroup}>
          <label>Scale</label>
          <div className={styles.vectorInput}>
            <input
              type="number"
              value={scale?.[0] || 1}
              onChange={(e) => handleUpdate('scale', [(scale?.[0] || 1), (scale?.[1] || 1), (scale?.[2] || 1)].map((v, i) => i === 0 ? parseFloat(e.target.value) || 1 : v))}
              step="0.1"
              min="0.1"
              className={styles.propertyInput}
            />
            <input
              type="number"
              value={scale?.[1] || 1}
              onChange={(e) => handleUpdate('scale', [(scale?.[0] || 1), (scale?.[1] || 1), (scale?.[2] || 1)].map((v, i) => i === 1 ? parseFloat(e.target.value) || 1 : v))}
              step="0.1"
              min="0.1"
              className={styles.propertyInput}
            />
            <input
              type="number"
              value={scale?.[2] || 1}
              onChange={(e) => handleUpdate('scale', [(scale?.[0] || 1), (scale?.[1] || 1), (scale?.[2] || 1)].map((v, i) => i === 2 ? parseFloat(e.target.value) || 1 : v))}
              step="0.1"
              min="0.1"
              className={styles.propertyInput}
            />
          </div>
        </div>

        <div className={styles.propertyGroup}>
          <label>Mass</label>
          <input
            type="number"
            value={mass || 1}
            onChange={(e) => handleUpdate('mass', parseFloat(e.target.value) || 1)}
            step="0.1"
            min="0"
            className={styles.propertyInput}
          />
        </div>

        <div className={styles.propertyGroup}>
          <label>Friction</label>
          <input
            type="number"
            value={friction || 0.5}
            onChange={(e) => handleUpdate('friction', parseFloat(e.target.value) || 0.5)}
            step="0.1"
            min="0"
            max="1"
            className={styles.propertyInput}
          />
        </div>

        <div className={styles.propertyGroup}>
          <label>Restitution (Bounciness)</label>
          <input
            type="number"
            value={restitution || 0.3}
            onChange={(e) => handleUpdate('restitution', parseFloat(e.target.value) || 0.3)}
            step="0.1"
            min="0"
            max="1"
            className={styles.propertyInput}
          />
        </div>
      </div>
    </div>
  );
}

export default function PhysicsEditorPage() {
  const [objects, setObjects] = useState([
    {
      id: '1',
      type: 'box',
      position: [0, 2, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      mass: 1,
      friction: 0.5,
      restitution: 0.3,
      constraints: []
    },
    {
      id: '2',
      type: 'sphere',
      position: [2, 3, 0],
      rotation: [0, 0, 0],
      scale: [0.5, 0.5, 0.5],
      mass: 0.5,
      friction: 0.3,
      restitution: 0.8,
      constraints: []
    }
  ]);

  const [selectedId, setSelectedId] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [transformMode, setTransformMode] = useState('translate');
  const [showGrid, setShowGrid] = useState(true);
  const [environmentPreset, setEnvironmentPreset] = useState('sunset');
  const [ambientIntensity, setAmbientIntensity] = useState(0.4);
  const [directionalIntensity, setDirectionalIntensity] = useState(0.8);

  const selectedObject = objects.find(obj => obj.id === selectedId);

  const addObject = (type) => {
    const newObject = {
      id: Date.now().toString(),
      type,
      position: [0, 5, 0],
      rotation: [0, 0, 0],
      scale: type === 'sphere' ? [0.5, 0.5, 0.5] : [1, 1, 1],
      mass: 1,
      friction: 0.5,
      restitution: 0.3,
      constraints: []
    };
    setObjects(prev => [...prev, newObject]);
    setSelectedId(newObject.id);
  };

  const updateObject = (id, field, value) => {
    setObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, [field]: value } : obj
    ));
  };

  const deleteObject = (id) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const duplicateObject = (id) => {
    const obj = objects.find(o => o.id === id);
    if (obj) {
      const newObject = {
        ...obj,
        id: Date.now().toString(),
        position: [obj.position[0] + 1, obj.position[1], obj.position[2]]
      };
      setObjects(prev => [...prev, newObject]);
      setSelectedId(newObject.id);
    }
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    // Reset all objects to their initial positions
    setObjects(prev => prev.map(obj => ({
      ...obj,
      position: obj.position // In a real implementation, you'd reset to initial positions
    })));
  };

  return (
    <div className={styles.root}>
      <Topbar />
      
      <div className={styles.mainContent}>
        <div className={styles.sidebar}>
          <EditorTabs activeTab="physics" />
          
          <div className={styles.toolbar}>
            <div className={styles.toolGroup}>
              <h4>Add Objects</h4>
              <div className={styles.toolButtons}>
                <button 
                  className={styles.toolBtn}
                  onClick={() => addObject('box')}
                  title="Add Box"
                >
                  <FiBox />
                </button>
                <button 
                  className={styles.toolBtn}
                  onClick={() => addObject('sphere')}
                  title="Add Sphere"
                >
                  <FiCircle />
                </button>
                <button 
                  className={styles.toolBtn}
                  onClick={() => addObject('cylinder')}
                  title="Add Cylinder"
                >
                  <FiSquare />
                </button>
                <button 
                  className={styles.toolBtn}
                  onClick={() => addObject('capsule')}
                  title="Add Capsule"
                >
                  <FiTarget />
                </button>
              </div>
            </div>

            <div className={styles.toolGroup}>
              <h4>Simulation</h4>
              <div className={styles.toolButtons}>
                <button 
                  className={`${styles.toolBtn} ${isSimulating ? styles.active : ''}`}
                  onClick={() => setIsSimulating(!isSimulating)}
                  title={isSimulating ? "Pause Simulation" : "Start Simulation"}
                >
                  {isSimulating ? <FiPause /> : <FiPlay />}
                </button>
                <button 
                  className={styles.toolBtn}
                  onClick={resetSimulation}
                  title="Reset Simulation"
                >
                  <FiRefreshCw />
                </button>
              </div>
            </div>

            <div className={styles.toolGroup}>
              <h4>Transform</h4>
              <div className={styles.toolButtons}>
                <button 
                  className={`${styles.toolBtn} ${transformMode === 'translate' ? styles.active : ''}`}
                  onClick={() => setTransformMode('translate')}
                  title="Move"
                >
                  <FiMove />
                </button>
                <button 
                  className={`${styles.toolBtn} ${transformMode === 'rotate' ? styles.active : ''}`}
                  onClick={() => setTransformMode('rotate')}
                  title="Rotate"
                >
                  <FiRotateCw />
                </button>
                <button 
                  className={`${styles.toolBtn} ${transformMode === 'scale' ? styles.active : ''}`}
                  onClick={() => setTransformMode('scale')}
                  title="Scale"
                >
                  <FiMaximize2 />
                </button>
              </div>
            </div>

            <div className={styles.toolGroup}>
              <h4>View</h4>
              <div className={styles.toolButtons}>
                <button 
                  className={`${styles.toolBtn} ${showGrid ? styles.active : ''}`}
                  onClick={() => setShowGrid(!showGrid)}
                  title="Toggle Grid"
                >
                  <FiGrid />
                </button>
              </div>
            </div>

            <div className={styles.toolGroup}>
              <h4>Environment</h4>
              <select 
                value={environmentPreset}
                onChange={(e) => setEnvironmentPreset(e.target.value)}
                className={styles.propertyInput}
              >
                <option value="none">None</option>
                <option value="sunset">Sunset</option>
                <option value="dawn">Dawn</option>
                <option value="night">Night</option>
                <option value="warehouse">Warehouse</option>
                <option value="forest">Forest</option>
                <option value="apartment">Apartment</option>
                <option value="studio">Studio</option>
                <option value="city">City</option>
                <option value="park">Park</option>
                <option value="lobby">Lobby</option>
              </select>
            </div>

            <div className={styles.toolGroup}>
              <h4>Lighting</h4>
              <div className={styles.propertyGroup}>
                <label>Ambient</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={ambientIntensity}
                  onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
                />
              </div>
              <div className={styles.propertyGroup}>
                <label>Directional</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={directionalIntensity}
                  onChange={(e) => setDirectionalIntensity(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Physics Inspector */}
          <PhysicsInspector
            selectedObject={selectedObject}
            onUpdate={updateObject}
            onDelete={deleteObject}
          />
        </div>

        <div className={styles.viewport}>
          <Canvas 
            shadows 
            camera={{ position: [5, 5, 8], fov: 50 }}
            onPointerMissed={(e) => {
              if (e.button === 0) setSelectedId(null);
            }}
            style={{ background: '#1a1a1a' }}
          >
            <ambientLight intensity={ambientIntensity} />
            <directionalLight position={[5, 10, 5]} intensity={directionalIntensity} />
            <PerspectiveCamera makeDefault position={[5, 5, 8]} fov={50} />
            <OrbitControls 
              makeDefault 
              enableRotate
              enablePan
              enableZoom
              zoomSpeed={0.8}
              panSpeed={0.8}
              rotateSpeed={0.8}
            />
            
            {environmentPreset !== 'none' && <Environment preset={environmentPreset} />}
            
            {showGrid && <Grid args={[20, 20]} position={[0, 0, 0]} />}
            
            {/* Ground plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#333333" />
            </mesh>

            {objects.map((obj) => (
              <PhysicsObject
                key={obj.id}
                object={obj}
                onSelect={setSelectedId}
                isSelected={selectedId === obj.id}
                onUpdate={updateObject}
              />
            ))}

            {selectedObject && (
              <TransformControls
                object={selectedObject}
                mode={transformMode}
                onObjectChange={(e) => {
                  if (e.target.object) {
                    const { position, rotation, scale } = e.target.object;
                    updateObject(selectedId, 'position', [position.x, position.y, position.z]);
                    updateObject(selectedId, 'rotation', [rotation.x, rotation.y, rotation.z]);
                    updateObject(selectedId, 'scale', [scale.x, scale.y, scale.z]);
                  }
                }}
              />
            )}
          </Canvas>
        </div>
      </div>
    </div>
  );
}
