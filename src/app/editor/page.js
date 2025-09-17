"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
import AuthModal from "../components/AuthModal";
import SceneManager from "../components/SceneManager";
import UserStatus from "../components/UserStatus";
import { useAuth } from "../contexts/AuthContext";
import { useCollaboration } from "../contexts/CollaborationContext";
import Link from "next/link";

// React Icons
import { 
  FiTarget, FiEdit3, FiTool, FiMove, FiRotateCw, FiMaximize2,
  FiGlobe, FiLayers, FiGrid, FiEye, FiEyeOff, FiPlay, FiPause,
  FiPlus, FiMinus, FiCopy, FiTrash2, FiSettings, FiZap,
  FiBox, FiCircle, FiSquare, FiCpu, FiWifi,
  FiSun, FiMoon, FiVolume2, FiVolumeX, FiSave, FiDownload,
  FiUpload, FiRefreshCw, FiChevronDown, FiChevronRight,
  FiX, FiCheck, FiAlertCircle, FiInfo, FiHelpCircle,
  FiMenu, FiMaximize, FiMinimize, FiMoreHorizontal
} from "react-icons/fi";

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
  const { user, loading: authLoading } = useAuth();
  const { socket, updateObject, deleteObject } = useCollaboration();
  
  // Auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  
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
  const [currentScene, setCurrentScene] = useState(null);
  
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
  const [showTimeline, setShowTimeline] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showChat, setShowChat] = useState(true);
  
  // AI Prompt
  const [isPromptOpen, setPromptOpen] = useState(false);
  const [promptText, setPromptText] = useState("");

  // Save / Load helpers
  const saveCurrentScene = async () => {
    try {
      if (!currentScene) return;
      const res = await fetch(`/api/scenes/${currentScene.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentScene.name || 'Untitled Scene',
          objects: sceneObjects,
          groups: sceneGroups,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  const saveAsNewScene = async () => {
    try {
      const res = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo_user' },
        body: JSON.stringify({
          name: `Scene ${new Date().toLocaleString()}`,
          objects: sceneObjects,
          groups: sceneGroups,
        }),
      });
      if (!res.ok) throw new Error('Failed to save as');
      const data = await res.json();
      setCurrentScene(data.scene);
    } catch (e) {
      console.error('Save As failed', e);
    }
  };

  // WebSocket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleSceneState = (data) => {
      setSceneObjects(data.objects || []);
      setSceneGroups(data.groups || []);
    };

    const handleObjectUpdated = (data) => {
      setSceneObjects(prev => {
        const existingIndex = prev.findIndex(obj => obj.id === data.object.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = data.object;
          return updated;
        } else {
          return [...prev, data.object];
        }
      });
    };

    const handleObjectDeleted = (data) => {
      setSceneObjects(prev => prev.filter(obj => obj.id !== data.object_id));
    };

    socket.on('scene_state', handleSceneState);
    socket.on('object_updated', handleObjectUpdated);
    socket.on('object_deleted', handleObjectDeleted);

    return () => {
      socket.off('scene_state', handleSceneState);
      socket.off('object_updated', handleObjectUpdated);
      socket.off('object_deleted', handleObjectDeleted);
    };
  }, [socket]);
  
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
    
    // Sync with server
    const updatedObject = objs.find(o => o.id === id);
    if (updatedObject && currentScene) {
      updateObject(updatedObject);
    }
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
    
    // Sync with server
    if (currentScene) {
      updateObject(newObj);
    }
  };

  const removeObject = (id) => {
    setSceneObjects(sceneObjects.filter((o) => o.id !== id));
    
    // Sync with server
    if (currentScene) {
      deleteObject(id);
    }
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
      
      // Sync with server
      if (currentScene) {
        updateObject(newObj);
      }
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
    
    // Sync new objects with server
    if (currentScene) {
      objects.forEach(obj => updateObject(obj));
    }
  };

  const handleSceneLoad = (scene) => {
    setCurrentScene(scene);
    if (scene) {
      setSceneObjects(scene.objects || []);
      setSceneGroups(scene.groups || []);
    } else {
      setSceneObjects([{
        id: "box_1",
        object: "cube",
        dimensions: [1, 0.5, 1],
        position: [0, 0.25, 0],
        rotation: [0, 0, 0],
        material: "#FF8C42",
      }]);
      setSceneGroups([]);
    }
  };

  const handleSceneCreate = (scene) => {
    setCurrentScene(scene);
    setSceneObjects(scene.objects || []);
    setSceneGroups(scene.groups || []);
  };

  // Skip auth for now - create a demo user
  const demoUser = { id: 'demo_user', username: 'Demo User' };
  const demoToken = 'demo_token';

  const cameraProps = useMemo(() => ({ position: [5, 5, 8], fov: 50 }), []);

  return (
    <div className={styles.editorContainer}>
      <Topbar />
      {/* Quick Save Buttons */}
      <div className={styles.quickActions}>
        <button className={styles.topButton} onClick={saveCurrentScene} title="Save (updates current scene)"><FiSave /> Save</button>
        <button className={styles.topButton} onClick={saveAsNewScene} title="Save As (creates a new scene)"><FiDownload /> Save As</button>
      </div>
      
      {/* Profile Icon (kept minimal) */}
      {user && (
        <div className={styles.profileIcon}>
          <Link href="/profile" className={styles.profileLink}>
            <div className={styles.profileAvatar}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </Link>
        </div>
      )}
      
      {/* Main Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${activeMode === 'object' ? styles.active : ''}`}
            onClick={() => setActiveMode('object')}
            title="Object Mode"
          >
            <FiTarget />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${activeMode === 'edit' ? styles.active : ''}`}
            onClick={() => setActiveMode('edit')}
            title="Edit Mode"
          >
            <FiEdit3 />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${activeMode === 'sculpt' ? styles.active : ''}`}
            onClick={() => setActiveMode('sculpt')}
            title="Sculpt Mode"
          >
            <FiTool />
          </button>
        </div>

        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${transformMode === 'translate' ? styles.active : ''}`}
            onClick={() => setTransformMode('translate')}
            title="Move (G)"
          >
            <FiMove />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${transformMode === 'rotate' ? styles.active : ''}`}
            onClick={() => setTransformMode('rotate')}
            title="Rotate (R)"
          >
            <FiRotateCw />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${transformMode === 'scale' ? styles.active : ''}`}
            onClick={() => setTransformMode('scale')}
            title="Scale (S)"
          >
            <FiMaximize2 />
          </button>
        </div>

        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${coordinateSystem === 'global' ? styles.active : ''}`}
            onClick={() => setCoordinateSystem('global')}
            title="Global Coordinates"
          >
            <FiGlobe />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${coordinateSystem === 'local' ? styles.active : ''}`}
            onClick={() => setCoordinateSystem('local')}
            title="Local Coordinates"
          >
            <FiLayers />
          </button>
        </div>

        <div className={styles.toolbarSection}>
          <button 
            className={`${styles.toolbarBtn} ${snapEnabled ? styles.active : ''}`}
            onClick={() => setSnapEnabled(!snapEnabled)}
            title="Snap to Grid"
          >
            <FiGrid />
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
            <FiZap />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${viewMode === 'solid' ? styles.active : ''}`}
            onClick={() => setViewMode('solid')}
            title="Solid"
          >
            <FiBox />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${viewMode === 'material' ? styles.active : ''}`}
            onClick={() => setViewMode('material')}
            title="Material Preview"
          >
            <FiTool />
          </button>
          <button 
            className={`${styles.toolbarBtn} ${viewMode === 'rendered' ? styles.active : ''}`}
            onClick={() => setViewMode('rendered')}
            title="Rendered"
          >
            <FiSun />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout}>
        {/* Left Panel - Scene Info */}
        {showOutliner && (
          <div className={styles.leftPanel}>
            <SceneManager 
              onSceneLoad={handleSceneLoad}
              onSceneCreate={handleSceneCreate}
            />
            <div className={styles.panelHeader}>
              <h3>Objects</h3>
              <button onClick={() => setShowOutliner(false)}>
                <FiX />
              </button>
            </div>
            <div className={styles.outlinerContent}>
              <div className={styles.outlinerItem}>
                <span className={styles.outlinerFolder}>
                  <FiChevronDown />
                  <FiLayers />
                  Scene
                </span>
                <div className={styles.outlinerChildren}>
                  {sceneObjects.map((obj) => (
                    <div 
                      key={obj.id} 
                      className={`${styles.outlinerObject} ${selectedId === obj.id ? styles.selected : ''}`}
                      onClick={() => setSelectedId(obj.id)}
                    >
                      <span className={styles.objectIcon}>
                        {obj.object === 'cube' ? <FiBox /> : obj.object === 'sphere' ? <FiCircle /> : <FiSquare />}
                      </span>
                      <span className={styles.objectName}>{obj.id} · pos({obj.position?.map(n=>Number(n).toFixed(2)).join(', ')})</span>
                      
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
            </div>
            <div className={styles.viewportControls}>
              <button onClick={() => setShowGrid(!showGrid)} className={showGrid ? styles.active : ''}>
                <FiGrid />
                Grid
              </button>
              <button onClick={() => setShowAxes(!showAxes)} className={showAxes ? styles.active : ''}>
                <FiLayers />
                Axes
              </button>
            </div>
          </div>
          
          <div className={styles.viewport}>
            {/* Click empty space to deselect */}
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

        {/* Right Panel - Chatbot (default visible) */}
        {showChat && (
          <div className={styles.chatPanel}>
            <div className={styles.chatHeader}>
              <h3>Chatbot</h3>
              <button className={styles.chatToggleBtn} onClick={() => setShowChat(false)}><FiX /> Hide</button>
            </div>
            <div className={styles.chatBody}>
              <p>Ask AI for help with modeling, materials, and more.</p>
            </div>
            <div className={styles.chatInputBar}>
              <input className={styles.chatInput} placeholder="Type a prompt..." />
              <button className={styles.chatSendBtn}>Send</button>
            </div>
          </div>
        )}

        {!showChat && (
          <button className={styles.chatToggleBtn} onClick={() => setShowChat(true)}>Show Chat</button>
        )}

        {/* Properties panel moved into left info panel earlier; keeping existing sections below the viewport for now */}
        {false && showProperties && (
          <div className={styles.rightPanel}>
            <div className={styles.panelHeader}>
              <h3>Properties</h3>
              <button onClick={() => setShowProperties(false)}>
                <FiX />
              </button>
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

      {/* Timeline removed for simplicity */}

      {/* Add Object panel removed for simplicity */}

      {/* Prompt modal removed; use chat panel instead */}

      {/* Floating AI button removed */}
    </div>
  );
}
