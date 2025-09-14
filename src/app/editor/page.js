"use client";

import React, { useState, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  PerspectiveCamera,
  TransformControls,
  Environment,
  Sky
} from "@react-three/drei";
import styles from "./editor.module.css";
import Topbar from "../Topbar";
import SelectableMesh from "../components/selectableMesh";
import GroupMesh from "../components/GroupMesh";

function MeshFromObj({ o }) {
  const { id, object, dimensions, position, rotation, material } = o;
  const color = material || "#888888";

  const geom =
    object === "sphere" ? (
      <sphereGeometry args={[dimensions[0] / 2 || 0.5, 32, 32]} />
    ) : object === "cylinder" ? (
      <cylinderGeometry
        args={[
          dimensions[0] / 2 || 0.25,
          dimensions[0] / 2 || 0.25,
          dimensions[1] || 1,
          32,
        ]}
      />
    ) : (
      <boxGeometry
        args={[
          dimensions[0] || 1,
          dimensions[1] || 1,
          dimensions[2] || 1,
        ]}
      />
    );

  return (
    <mesh
      key={id}
      position={position || [0, (dimensions?.[1] || 1) / 2, 0]}
      rotation={rotation || [0, 0, 0]}
      castShadow
      receiveShadow
    >
      {geom}
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export default function EditorPage() {
  // Scene state
  const [sceneObjects, setSceneObjects] = useState([
    {
      id: "box_1",
      object: "cube",
      dimensions: [1, 0.5, 1],
      position: [0, 0.25, 0],
      rotation: [0, 0, 0],
      material: "#FF8C42",
    },
  ]);
  const [sceneGroups, setSceneGroups] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  
  // UI State
  const [activeMode, setActiveMode] = useState('object'); // object, edit, sculpt, etc.
  const [transformMode, setTransformMode] = useState('translate'); // translate, rotate, scale
  const [coordinateSystem, setCoordinateSystem] = useState('global'); // global, local
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapValue, setSnapValue] = useState(0.1);
  
  // Viewport settings
  const [viewMode, setViewMode] = useState('solid'); // wireframe, solid, material, rendered
  const [shadingMode, setShadingMode] = useState('smooth'); // flat, smooth
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [gridDivisions, setGridDivisions] = useState(10);
  
  // Lighting
  const [ambientIntensity, setAmbientIntensity] = useState(0.6);
  const [directionalIntensity, setDirectionalIntensity] = useState(0.7);
  const [environmentPreset, setEnvironmentPreset] = useState('sunset');
  
  // Animation
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [totalFrames, setTotalFrames] = useState(250);
  const [fps, setFps] = useState(24);
  
  // Panels visibility
  const [showOutliner, setShowOutliner] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showToolbar, setShowToolbar] = useState(true);
  
  // AI Prompt
  const [isPromptOpen, setPromptOpen] = useState(false);
  const [promptText, setPromptText] = useState("");
  
  const updateObjectField = (id, field, value) => {
    const objs = sceneObjects.map((o) => {
      if (o.id !== id) return o;
      const copy = { ...o };
      if (["position", "rotation", "dimensions"].includes(field)) {
        copy[field] = value.split(",").map(Number);
      } else {
        copy[field] = value;
      }
      return copy;
    });
    setSceneObjects(objs);
  };

  const updateScene = (objs, grps) => {
    setSceneObjects(objs);
    setSceneGroups(grps);
  };

  const addPrimitive = (type) => {
    const newId = `${type}_${Date.now() % 10000}`;
    const base = { dimensions: [1, 1, 1] };
    const newObj = {
      id: newId,
      object: type,
      position: [0, (base.dimensions[1] || 1) / 2, 0],
      rotation: [0, 0, 0],
      material: "#999999",
      ...base,
    };
    setSceneObjects([...sceneObjects, newObj]);
  };

  const removeObject = (id) => {
    setSceneObjects(sceneObjects.filter((o) => o.id !== id));
  };

  const duplicateObject = (id) => {
    const obj = sceneObjects.find(o => o.id === id);
    if (obj) {
      const newObj = {
        ...obj,
        id: `${obj.id}_copy_${Date.now() % 10000}`,
        position: [obj.position[0] + 1, obj.position[1], obj.position[2]]
      };
      setSceneObjects([...sceneObjects, newObj]);
    }
  };

  const simulateAI = (text) => {
  const t = text.toLowerCase();

  if (t.includes("table")) {
    return {
      objects: [],
      groups: [
        {
          id: "table",
          children: [
            {
              id: "table_top",
              object: "cube",
              dimensions: [2, 0.15, 1.2],
              position: [0, 0.9, 0],
              rotation: [0, 0, 0],
              material: "#6B4C3B",
            },
            {
              id: "leg_1",
              object: "cube",
              dimensions: [0.12, 0.9, 0.12],
              position: [-0.92, 0.45, -0.52],
              rotation: [0, 0, 0],
              material: "#6B4C3B",
            },
            {
              id: "leg_2",
              object: "cube",
              dimensions: [0.12, 0.9, 0.12],
              position: [0.92, 0.45, -0.52],
              rotation: [0, 0, 0],
              material: "#6B4C3B",
            },
            {
              id: "leg_3",
              object: "cube",
              dimensions: [0.12, 0.9, 0.12],
              position: [-0.92, 0.45, 0.52],
              rotation: [0, 0, 0],
              material: "#6B4C3B",
            },
            {
              id: "leg_4",
              object: "cube",
              dimensions: [0.12, 0.9, 0.12],
              position: [0.92, 0.45, 0.52],
              rotation: [0, 0, 0],
              material: "#6B4C3B",
            },
          ],
        },
      ],
    };
  } else if (t.includes("chair")) {
    return {
      objects: [],
      groups: [
        {
          id: "chair",
          children: [
            {
              id: "seat",
              object: "cube",
              dimensions: [0.6, 0.12, 0.6],
              position: [0, 0.5, 0],
              rotation: [0, 0, 0],
              material: "#7B3F00",
            },
            {
              id: "leg1",
              object: "cube",
              dimensions: [0.08, 0.5, 0.08],
              position: [-0.25, 0.25, -0.25],
              rotation: [0, 0, 0],
              material: "#7B3F00",
            },
            {
              id: "leg2",
              object: "cube",
              dimensions: [0.08, 0.5, 0.08],
              position: [0.25, 0.25, -0.25],
              rotation: [0, 0, 0],
              material: "#7B3F00",
            },
            {
              id: "leg3",
              object: "cube",
              dimensions: [0.08, 0.5, 0.08],
              position: [-0.25, 0.25, 0.25],
              rotation: [0, 0, 0],
              material: "#7B3F00",
            },
            {
              id: "leg4",
              object: "cube",
              dimensions: [0.08, 0.5, 0.08],
              position: [0.25, 0.25, 0.25],
              rotation: [0, 0, 0],
              material: "#7B3F00",
            },
            {
              id: "backrest",
              object: "cube",
              dimensions: [0.6, 0.9, 0.12],
              position: [0, 0.95, -0.24],
              rotation: [0, 0, 0],
              material: "#7B3F00",
            },
          ],
        },
      ],
    };
  } else if (t.includes("sphere") || t.includes("ball")) {
    return {
      objects: [
        {
          id: "sphere_1",
          object: "sphere",
          dimensions: [1, 1, 1],
          position: [0, 0.5, 0],
          rotation: [0, 0, 0],
          material: "#2EC4B6",
        },
      ],
      groups: [],
    };
  } else {
    return {
      objects: [
        {
          id: "cube_a",
          object: "cube",
          dimensions: [1, 1, 1],
          position: [-1.5, 0.5, 0],
          rotation: [0, 0, 0],
          material: "#FF6B6B",
        },
        {
          id: "cube_b",
          object: "cube",
          dimensions: [1, 1, 1],
          position: [1.5, 0.5, 0],
          rotation: [0, 0, 0],
          material: "#4D96FF",
        },
      ],
      groups: [],
    };
  }
};

  const handleGenerate = async () => {
    const { objects, groups } = simulateAI(promptText || "two cubes");
    updateScene(objects, groups);
    setPromptOpen(false);
  };

  const cameraProps = useMemo(() => ({ position: [5, 5, 8], fov: 50 }), []);

  return (
    <div className={styles.editorContainer}>
      <Topbar />
      
      {/* Main Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${activeMode === 'object' ? styles.active : ''}`}
            onClick={() => setActiveMode('object')}
            title="Object Mode"
          >
            🎯
          </button>
          <button 
            className={`${styles.toolbarBtn} ${activeMode === 'edit' ? styles.active : ''}`}
            onClick={() => setActiveMode('edit')}
            title="Edit Mode"
          >
            ✏️
          </button>
          <button 
            className={`${styles.toolbarBtn} ${activeMode === 'sculpt' ? styles.active : ''}`}
            onClick={() => setActiveMode('sculpt')}
            title="Sculpt Mode"
          >
            🎨
          </button>
        </div>

        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${transformMode === 'translate' ? styles.active : ''}`}
            onClick={() => setTransformMode('translate')}
            title="Move (G)"
          >
            ↔️
          </button>
          <button 
            className={`${styles.toolbarBtn} ${transformMode === 'rotate' ? styles.active : ''}`}
            onClick={() => setTransformMode('rotate')}
            title="Rotate (R)"
          >
            🔄
          </button>
          <button 
            className={`${styles.toolbarBtn} ${transformMode === 'scale' ? styles.active : ''}`}
            onClick={() => setTransformMode('scale')}
            title="Scale (S)"
          >
            📏
          </button>
        </div>

        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${coordinateSystem === 'global' ? styles.active : ''}`}
            onClick={() => setCoordinateSystem('global')}
            title="Global Coordinates"
          >
            🌍
          </button>
          <button 
            className={`${styles.toolbarBtn} ${coordinateSystem === 'local' ? styles.active : ''}`}
            onClick={() => setCoordinateSystem('local')}
            title="Local Coordinates"
          >
            📐
          </button>
        </div>

        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${snapEnabled ? styles.active : ''}`}
            onClick={() => setSnapEnabled(!snapEnabled)}
            title="Snap to Grid"
          >
            🧲
          </button>
          <input 
            type="number" 
            value={snapValue} 
            onChange={(e) => setSnapValue(Number(e.target.value))}
            className={styles.snapInput}
            title="Snap Value"
          />
        </div>

        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${viewMode === 'wireframe' ? styles.active : ''}`}
            onClick={() => setViewMode('wireframe')}
            title="Wireframe"
          >
            ⚡
          </button>
          <button 
            className={`${styles.toolbarBtn} ${viewMode === 'solid' ? styles.active : ''}`}
            onClick={() => setViewMode('solid')}
            title="Solid"
          >
            🟦
          </button>
          <button 
            className={`${styles.toolbarBtn} ${viewMode === 'material' ? styles.active : ''}`}
            onClick={() => setViewMode('material')}
            title="Material Preview"
          >
            🎨
          </button>
          <button 
            className={`${styles.toolbarBtn} ${viewMode === 'rendered' ? styles.active : ''}`}
            onClick={() => setViewMode('rendered')}
            title="Rendered"
          >
            🌟
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout}>
        {/* Left Panel - Outliner */}
        {showOutliner && (
          <div className={styles.leftPanel}>
            <div className={styles.panelHeader}>
              <h3>Outliner</h3>
              <button onClick={() => setShowOutliner(false)}>×</button>
            </div>
            <div className={styles.outlinerContent}>
              <div className={styles.outlinerItem}>
                <span>📁 Scene Collection</span>
                <div className={styles.outlinerChildren}>
                  {sceneObjects.map((obj) => (
                    <div 
                      key={obj.id} 
                      className={`${styles.outlinerObject} ${selectedId === obj.id ? styles.selected : ''}`}
                      onClick={() => setSelectedId(obj.id)}
                    >
                      <span>{obj.object === 'cube' ? '📦' : obj.object === 'sphere' ? '⚪' : '🥤'}</span>
                      <span>{obj.id}</span>
                      <div className={styles.objectActions}>
                        <button onClick={() => duplicateObject(obj.id)} title="Duplicate">📋</button>
                        <button onClick={() => removeObject(obj.id)} title="Delete">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Center - 3D Viewport */}
        <div className={styles.viewportContainer}>
          <div className={styles.viewportHeader}>
            <div className={styles.viewportInfo}>
              <span>3D Viewport</span>
              <span className={styles.viewportMode}>{viewMode.toUpperCase()}</span>
            </div>
            <div className={styles.viewportControls}>
              <button onClick={() => setShowGrid(!showGrid)} className={showGrid ? styles.active : ''}>
                Grid
              </button>
              <button onClick={() => setShowAxes(!showAxes)} className={showAxes ? styles.active : ''}>
                Axes
              </button>
            </div>
          </div>
          
          <div className={styles.viewport}>
            <Canvas shadows camera={{ position: [5, 5, 8], fov: 50 }}>
              <ambientLight intensity={ambientIntensity} />
              <directionalLight position={[5, 10, 5]} intensity={directionalIntensity} />
              <PerspectiveCamera makeDefault position={[5, 5, 8]} fov={50} />
              <OrbitControls makeDefault />
              
              {environmentPreset !== 'none' && <Environment preset={environmentPreset} />}
              
              {showGrid && <Grid args={[gridSize, gridDivisions]} position={[0, 0, 0]} />}
              {showAxes && <axesHelper args={[Math.max(3, gridSize / 2)]} />}
              
              {sceneObjects.map((o) => (
                <SelectableMesh
                  key={o.id}
                  o={o}
                  updateObject={updateObjectField}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  transformMode={transformMode}
                  coordinateSystem={coordinateSystem}
                  snapEnabled={snapEnabled}
                  snapValue={snapValue}
                />
              ))}

              {sceneGroups.map((g) => (
                <GroupMesh
                  key={g.id}
                  group={g}
                  updateGroup={(id, pos) => {
                    const updated = sceneGroups.map((x) =>
                      x.id === id ? { ...x, position: pos } : x
                    );
                    setSceneGroups(updated);
                  }}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                />
              ))}

              <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0.001]}>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial opacity={0.02} transparent />
              </mesh>
            </Canvas>
          </div>
        </div>

        {/* Right Panel - Properties */}
        {showProperties && (
          <div className={styles.rightPanel}>
            <div className={styles.panelHeader}>
              <h3>Properties</h3>
              <button onClick={() => setShowProperties(false)}>×</button>
            </div>
            
            <div className={styles.propertiesContent}>
              {/* Transform Properties */}
              <div className={styles.propertyGroup}>
                <h4>Transform</h4>
                {selectedId && (() => {
                  const obj = sceneObjects.find(o => o.id === selectedId);
                  return obj ? (
                    <div className={styles.transformInputs}>
                      <div className={styles.inputRow}>
                        <label>Location</label>
                        <input 
                          type="number" 
                          value={obj.position[0].toFixed(2)} 
                          onChange={(e) => updateObjectField(obj.id, 'position', `${e.target.value},${obj.position[1]},${obj.position[2]}`)}
                        />
                        <input 
                          type="number" 
                          value={obj.position[1].toFixed(2)} 
                          onChange={(e) => updateObjectField(obj.id, 'position', `${obj.position[0]},${e.target.value},${obj.position[2]}`)}
                        />
                        <input 
                          type="number" 
                          value={obj.position[2].toFixed(2)} 
                          onChange={(e) => updateObjectField(obj.id, 'position', `${obj.position[0]},${obj.position[1]},${e.target.value}`)}
                        />
                      </div>
                      <div className={styles.inputRow}>
                        <label>Rotation</label>
                        <input 
                          type="number" 
                          value={obj.rotation[0].toFixed(2)} 
                          onChange={(e) => updateObjectField(obj.id, 'rotation', `${e.target.value},${obj.rotation[1]},${obj.rotation[2]}`)}
                        />
                        <input 
                          type="number" 
                          value={obj.rotation[1].toFixed(2)} 
                          onChange={(e) => updateObjectField(obj.id, 'rotation', `${obj.rotation[0]},${e.target.value},${obj.rotation[2]}`)}
                        />
                        <input 
                          type="number" 
                          value={obj.rotation[2].toFixed(2)} 
                          onChange={(e) => updateObjectField(obj.id, 'rotation', `${obj.rotation[0]},${obj.rotation[1]},${e.target.value}`)}
                        />
                      </div>
                      <div className={styles.inputRow}>
                        <label>Scale</label>
                        <input 
                          type="number" 
                          value={obj.dimensions[0].toFixed(2)} 
                          onChange={(e) => updateObjectField(obj.id, 'dimensions', `${e.target.value},${obj.dimensions[1]},${obj.dimensions[2]}`)}
                        />
                        <input 
                          type="number" 
                          value={obj.dimensions[1].toFixed(2)} 
                          onChange={(e) => updateObjectField(obj.id, 'dimensions', `${obj.dimensions[0]},${e.target.value},${obj.dimensions[2]}`)}
                        />
                        <input 
                          type="number" 
                          value={obj.dimensions[2].toFixed(2)} 
                          onChange={(e) => updateObjectField(obj.id, 'dimensions', `${obj.dimensions[0]},${obj.dimensions[1]},${e.target.value}`)}
                        />
                      </div>
                    </div>
                  ) : <p>No object selected</p>;
                })()}
              </div>

              {/* Material Properties */}
              <div className={styles.propertyGroup}>
                <h4>Material</h4>
                {selectedId && (() => {
                  const obj = sceneObjects.find(o => o.id === selectedId);
                  return obj ? (
                    <div className={styles.materialInputs}>
                      <div className={styles.inputRow}>
                        <label>Color</label>
                        <input 
                          type="color" 
                          value={obj.material || "#999999"} 
                          onChange={(e) => updateObjectField(obj.id, 'material', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : <p>No object selected</p>;
                })()}
              </div>

              {/* Viewport Settings */}
              <div className={styles.propertyGroup}>
                <h4>Viewport</h4>
                <div className={styles.viewportSettings}>
                  <div className={styles.inputRow}>
                    <label>Grid Size</label>
                    <input 
                      type="range" 
                      min="2" 
                      max="40" 
                      value={gridSize} 
                      onChange={(e) => setGridSize(Number(e.target.value))}
                    />
                    <span>{gridSize}</span>
                  </div>
                  <div className={styles.inputRow}>
                    <label>Grid Divisions</label>
                    <input 
                      type="number" 
                      min="2" 
                      max="64" 
                      value={gridDivisions} 
                      onChange={(e) => setGridDivisions(Number(e.target.value))}
                    />
                  </div>
                  <div className={styles.inputRow}>
                    <label>Ambient Light</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1" 
                      value={ambientIntensity} 
                      onChange={(e) => setAmbientIntensity(Number(e.target.value))}
                    />
                    <span>{ambientIntensity.toFixed(1)}</span>
                  </div>
                  <div className={styles.inputRow}>
                    <label>Directional Light</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1" 
                      value={directionalIntensity} 
                      onChange={(e) => setDirectionalIntensity(Number(e.target.value))}
                    />
                    <span>{directionalIntensity.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel - Timeline */}
      {showTimeline && (
        <div className={styles.timelinePanel}>
          <div className={styles.panelHeader}>
            <h3>Timeline</h3>
            <button onClick={() => setShowTimeline(false)}>×</button>
          </div>
          <div className={styles.timelineContent}>
            <div className={styles.timelineControls}>
              <button onClick={() => setIsPlaying(!isPlaying)} className={styles.playButton}>
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <div className={styles.frameInfo}>
                <span>Frame {currentFrame} / {totalFrames}</span>
                <span>FPS: {fps}</span>
              </div>
              <div className={styles.timelineSlider}>
                <input 
                  type="range" 
                  min="1" 
                  max={totalFrames} 
                  value={currentFrame} 
                  onChange={(e) => setCurrentFrame(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Object Panel */}
      <div className={styles.addObjectPanel}>
        <h4>Add Object</h4>
        <div className={styles.primitiveButtons}>
          <button onClick={() => addPrimitive("cube")} className={styles.primitiveBtn}>
            📦 Cube
          </button>
          <button onClick={() => addPrimitive("sphere")} className={styles.primitiveBtn}>
            ⚪ Sphere
          </button>
          <button onClick={() => addPrimitive("cylinder")} className={styles.primitiveBtn}>
            🥤 Cylinder
          </button>
          <button onClick={() => addPrimitive("plane")} className={styles.primitiveBtn}>
            ⬜ Plane
          </button>
        </div>
      </div>

      {/* AI Prompt Modal */}
      {isPromptOpen && (
        <div className={styles.promptModal}>
          <div className={styles.promptContent}>
            <div className={styles.promptHeader}>
              <h3>AI Prompt</h3>
              <button onClick={() => setPromptOpen(false)}>×</button>
            </div>
            <textarea
              placeholder='Describe what you want to create... e.g. "a wooden chair and a small round table"'
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className={styles.promptTextarea}
            />
            <div className={styles.promptActions}>
              <button onClick={() => setPromptOpen(false)} className={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleGenerate} className={styles.generateBtn}>
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Button */}
      <button onClick={() => setPromptOpen(true)} className={styles.aiButton}>
        🤖 AI
      </button>
    </div>
  );
}
