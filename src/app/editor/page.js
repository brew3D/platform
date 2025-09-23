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
import VoxelInstanced from "../components/VoxelInstanced";
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
  const { socket, updateObject, deleteObject, joinScene } = useCollaboration();
  
  // Auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  // Theme (for viewport toggle)
  const [theme, setTheme] = useState('dark');
  
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
  
  // Resizable left panel
  const [leftPanelWidth, setLeftPanelWidth] = useState(0.25); // fraction of container
  const isResizingRef = useRef(false);
  const containerRef = useRef(null);

  // AI Prompt
  const [isPromptOpen, setPromptOpen] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState([]); // {id, role, text} and {type: event}
  const chatBodyRef = useRef(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(null); // { url, name }
  const [isTransforming, setIsTransforming] = useState(false);

  // Save / Load helpers
  const saveCurrentScene = async () => {
    try {
      if (!currentScene) {
        // No current scene yet – fallback to Save As
        await saveAsNewScene();
        return;
      }
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
        headers: { 'Content-Type': 'application/json', 'x-user-id': (user?.id || 'demo_user') },
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

  // Resizer handlers
  useEffect(() => {
    const onMove = (e) => {
      if (!isResizingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const minPx = 220; // min width of left panel
      const maxPx = Math.max(260, rect.width * 0.6); // keep some space for viewport
      const x = e.clientX - rect.left; // position within container
      const clamped = Math.max(minPx, Math.min(x, maxPx));
      setLeftPanelWidth(clamped / rect.width);
      e.preventDefault();
    };
    const onUp = () => { isResizingRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startResize = (e) => {
    isResizingRef.current = true;
    e.preventDefault();
  };

  // Initialize theme from body attr or localStorage
  useEffect(() => {
    try {
      const current = typeof document !== 'undefined' ? (document.body.getAttribute('data-theme') || '') : '';
      const saved = typeof window !== 'undefined' ? (localStorage.getItem('theme') || '') : '';
      const initial = current || saved || 'dark';
      setTheme(initial);
      if (typeof document !== 'undefined') {
        document.body.setAttribute('data-theme', initial);
      }
      if (typeof window !== 'undefined' && saved !== initial) {
        localStorage.setItem('theme', initial);
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      if (typeof document !== 'undefined') {
        document.body.setAttribute('data-theme', next);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', next);
      }
    } catch {}
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

  // Auto-join a default scene so real-time works without manual load
  useEffect(() => {
    let didCancel = false;
    (async () => {
      try {
        if (currentScene) return;
        const res = await fetch('/api/scenes', { headers: { 'x-user-id': 'demo_user' } });
        if (!res.ok) return;
        const data = await res.json();
        const scene = data.scenes && data.scenes[0];
        if (!scene || didCancel) return;
        // Upsert to collaboration backend and join room
        try {
          await fetch(`http://127.0.0.1:5000/scenes/${scene.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo_token' },
            body: JSON.stringify({ objects: scene.objects || [], groups: scene.groups || [] })
          });
        } catch {}
        setCurrentScene(scene);
        setSceneObjects(scene.objects || []);
        setSceneGroups(scene.groups || []);
        joinScene?.(scene.id);
      } catch {}
    })();
    return () => { didCancel = true; };
  }, []);
  
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
    // Defaults per primitive
    let dimensions = [1, 1, 1];
    if (type === 'sphere') {
      dimensions = [1, 1, 1]; // radius is dimensions[0]
    } else if (type === 'cylinder') {
      dimensions = [0.5, 1, 0.5]; // radius at [0], height at [1]
    } else if (type === 'plane') {
      dimensions = [2, 2, 0.01];
    }

    const defaultY = type === 'plane' ? 0.001 : (dimensions[1] || 1) / 2;
    const newObj = {
      id: newId,
      object: type,
      position: [0, defaultY, 0],
      rotation: [0, 0, 0],
      material: "#999999",
      dimensions,
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
  } else if (t.includes("chair") || t.includes("chiar")) {
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
  } else if (t.includes("sofa") || t.includes("couch")) {
    return {
      objects: [],
      groups: [
        {
          id: "sofa",
          children: [
            { id: "sofa_base", object: "cube", dimensions: [2, 0.3, 0.8], position: [0, 0.15, 0], rotation: [0, 0, 0], material: "#4A5568" },
            { id: "sofa_seat", object: "cube", dimensions: [2, 0.25, 0.8], position: [0, 0.4, 0], rotation: [0, 0, 0], material: "#718096" },
            { id: "sofa_back", object: "cube", dimensions: [2, 0.8, 0.15], position: [0, 0.8, -0.33], rotation: [0, 0, 0], material: "#4A5568" },
            { id: "sofa_arm_l", object: "cube", dimensions: [0.15, 0.5, 0.8], position: [-0.925, 0.5, 0], rotation: [0, 0, 0], material: "#4A5568" },
            { id: "sofa_arm_r", object: "cube", dimensions: [0.15, 0.5, 0.8], position: [0.925, 0.5, 0], rotation: [0, 0, 0], material: "#4A5568" }
          ]
        }
      ]
    };
  } else if (t.includes("lamp") || t.includes("light")) {
    return {
      objects: [],
      groups: [
        {
          id: "lamp",
          children: [
            { id: "lamp_base", object: "cylinder", dimensions: [0.4, 0.08, 0.4], position: [0, 0.04, 0], rotation: [0, 0, 0], material: "#AAAAAA" },
            { id: "lamp_stem", object: "cylinder", dimensions: [0.08, 0.8, 0.08], position: [0, 0.44, 0], rotation: [0, 0, 0], material: "#CCCCCC" },
            { id: "lamp_shade", object: "cylinder", dimensions: [0.5, 0.4, 0.5], position: [0, 0.9, 0], rotation: [0, 0, 0], material: "#FFD166" },
            { id: "lamp_bulb", object: "sphere", dimensions: [0.25, 0.25, 0.25], position: [0, 0.7, 0], rotation: [0, 0, 0], material: "#FFF1B8" }
          ]
        }
      ]
    };
  } else if (t.includes("bookshelf") || t.includes("shelf")) {
    return {
      objects: [],
      groups: [
        {
          id: "bookshelf",
          children: [
            { id: "shelf_side_l", object: "cube", dimensions: [0.12, 1.8, 0.4], position: [-0.44, 0.9, 0], rotation: [0, 0, 0], material: "#8D6E63" },
            { id: "shelf_side_r", object: "cube", dimensions: [0.12, 1.8, 0.4], position: [0.44, 0.9, 0], rotation: [0, 0, 0], material: "#8D6E63" },
            { id: "shelf_top", object: "cube", dimensions: [1.0, 0.12, 0.4], position: [0, 1.8, 0], rotation: [0, 0, 0], material: "#A1887F" },
            { id: "shelf_mid1", object: "cube", dimensions: [1.0, 0.1, 0.38], position: [0, 1.3, 0], rotation: [0, 0, 0], material: "#A1887F" },
            { id: "shelf_mid2", object: "cube", dimensions: [1.0, 0.1, 0.38], position: [0, 0.8, 0], rotation: [0, 0, 0], material: "#A1887F" },
            { id: "shelf_bottom", object: "cube", dimensions: [1.0, 0.12, 0.4], position: [0, 0.12, 0], rotation: [0, 0, 0], material: "#A1887F" }
          ]
        }
      ]
    };
  } else if (t.includes("bed")) {
    return {
      objects: [],
      groups: [
        {
          id: "bed",
          children: [
            { id: "bed_frame", object: "cube", dimensions: [2.1, 0.25, 1.6], position: [0, 0.125, 0], rotation: [0, 0, 0], material: "#6D4C41" },
            { id: "bed_mattress", object: "cube", dimensions: [2.0, 0.3, 1.5], position: [0, 0.4, 0], rotation: [0, 0, 0], material: "#E0E0E0" },
            { id: "bed_headboard", object: "cube", dimensions: [2.1, 0.9, 0.12], position: [0, 0.8, -0.74], rotation: [0, 0, 0], material: "#6D4C41" },
            { id: "bed_pillow_l", object: "cube", dimensions: [0.9, 0.12, 0.4], position: [-0.55, 0.55, -0.5], rotation: [0, 0, 0], material: "#FFFFFF" },
            { id: "bed_pillow_r", object: "cube", dimensions: [0.9, 0.12, 0.4], position: [0.55, 0.55, -0.5], rotation: [0, 0, 0], material: "#FFFFFF" }
          ]
        }
      ]
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

  const appendChat = (entry) => {
    setChatLog(prev => [...prev, { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, ...entry }]);
  };

  // Merge helpers keep existing items (and their moved positions) and add/override by id
  const mergeObjects = (existing, incoming) => {
    const map = new Map((existing || []).map(o => [o.id, o]));
    for (const obj of incoming || []) {
      const prev = map.get(obj.id);
      map.set(obj.id, prev ? { ...prev, ...obj } : obj);
    }
    return Array.from(map.values());
  };

  const mergeGroups = (existing, incoming) => {
    const map = new Map((existing || []).map(g => [g.id, g]));
    for (const grp of incoming || []) {
      const prev = map.get(grp.id);
      map.set(grp.id, prev ? { ...prev, ...grp } : grp);
    }
    return Array.from(map.values());
  };

  useEffect(() => {
    if (!chatBodyRef.current) return;
    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [chatLog]);

  const handleChatSend = async () => {
    const text = (chatInput || "").trim();
    if (!text) return;
    setChatInput("");
    setErrorMsg("");
    appendChat({ role: 'user', text });

    // If user asks for voxel-based generation (e.g., "voxel dragon 64"), use backend Supervisor jobs
    const wantsVoxel = /voxel/.test(text.toLowerCase()) || /dragon/.test(text.toLowerCase());
    if (wantsVoxel) {
      try {
        setPipelineRunning(true);
        setStatusMsg('Submitting voxel job...');
        // Heuristics: subject and resolution
        const resMatch = text.match(/\b(32|48|64|80|96|128|256|512|1024|1536|2048)\b/);
        const resolution = resMatch ? Number(resMatch[1]) : 64;
        const subject = (/dragon/i.test(text) ? 'dragon' : (text || 'object'));
        const create = await fetch('http://127.0.0.1:5000/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'voxel', resolution, subject, style: 'default', pose: '' })
        });
        if (!create.ok) throw new Error(`Job create failed (${create.status})`);
        const c = await create.json();
        const jobId = c.jobId;
        setStatusMsg(`Job ${jobId} queued`);

        // Poll until complete
        let done = false;
        while (!done) {
          await new Promise(r => setTimeout(r, 1000));
          const st = await fetch(`http://127.0.0.1:5000/jobs/${jobId}`);
          if (!st.ok) continue;
          const info = await st.json();
          if (info.status === 'failed') {
            setErrorMsg(info.error || 'Voxel job failed');
            setPipelineRunning(false);
            setStatusMsg('');
            return;
          }
          if (info.progress && info.progress.length) {
            const last = info.progress[info.progress.length - 1];
            if (last?.msg) setStatusMsg(last.msg);
          }
          // Stream progressive LODs if present
          const lods = info.artifacts && info.artifacts.lods;
          if (lods && typeof lods === 'object') {
            // pick highest available LOD so far
            const keys = Object.keys(lods).map(k => Number(k)).sort((a,b)=>a-b);
            if (keys.length) {
              const latest = keys[keys.length - 1];
              const url = `http://127.0.0.1:5000${lods[String(latest)].path}`;
              const vf = await fetch(url);
              if (vf.ok) {
                const voxelData = await vf.json();
                const group = { id: `voxel_${Math.random().toString(36).slice(2,8)}`, type: 'voxel', voxel: { palette: voxelData.palette || [], voxels: voxelData.voxels || [] }, position: [0,0,0] };
                setSceneGroups(prev => mergeGroups(prev, [group]));
                appendChat({ role: 'agent', text: `LOD ${latest} ready (${(voxelData.voxels||[]).length} voxels)` });
              }
            }
          }
          if (info.status === 'completed') {
            done = true;
            setStatusMsg('Pipeline complete');
            setPipelineRunning(false);
            setTimeout(() => setStatusMsg(''), 1200);
            return;
          }
        }
      } catch (e) {
        const msg = 'Voxel pipeline error: ' + (e?.message || 'Unknown error');
        setStatusMsg(msg);
        setErrorMsg(msg);
        setPipelineRunning(false);
        return;
      }
    }

    // Stream from pipeline endpoint (NDJSON)
    try {
      setPipelineRunning(true);
      setStatusMsg('Starting pipeline...');
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: text,
          scene: { objects: sceneObjects, groups: sceneGroups },
          image_url: attachment?.url || null
        })
      });

      if (!res.ok || !res.body) {
        const msg = `Pipeline failed to start (${res.status})`;
        setStatusMsg(msg);
        setErrorMsg(msg);
        setPipelineRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        let read;
        try {
          read = await reader.read();
        } catch (e) {
          setErrorMsg('Stream aborted');
          break;
        }
        const { value, done } = read;
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.type === 'error') {
              setErrorMsg(evt.message || 'Pipeline error');
              setPipelineRunning(false);
              setStatusMsg('');
              continue;
            }
            if (evt.type === 'status') {
              setStatusMsg(evt.message || '');
            } else if (evt.type === 'parsing_result') {
              setStatusMsg('Parsed prompt');
            } else if (evt.type === 'reference_result') {
              setStatusMsg('References collected');
            } else if (evt.type === 'generation_result') {
              setStatusMsg('Base model generated');
              // Merge generated scene into current scene so prior moves persist
              const scene = evt.data?.scene;
              if (scene) {
                setSceneObjects(prev => mergeObjects(prev, scene.objects || []));
                setSceneGroups(prev => mergeGroups(prev, scene.groups || []));
              }
            } else if (evt.type === 'editing_result') {
              setStatusMsg('Edits applied');
              const scene = evt.data?.scene;
              if (scene) {
                setSceneObjects(prev => mergeObjects(prev, scene.objects || []));
                setSceneGroups(prev => mergeGroups(prev, scene.groups || []));
                if (currentScene) {
                  (scene.objects || []).forEach(obj => updateObject(obj));
                }
              }
            } else if (evt.type === 'validation_result') {
              setStatusMsg('Validation complete');
            } else if (evt.type === 'done') {
              setStatusMsg('Pipeline complete');
              // Final agent reply only at completion, in green
              appendChat({ role: 'agent', text: 'Pipeline completed successfully', variant: 'success' });
              setPipelineRunning(false);
              // Clear status after a short delay
              setTimeout(() => setStatusMsg(''), 1500);
            } else {
              if (evt.message) setStatusMsg(evt.message);
            }
          } catch (e) {
            // non-JSON line; ignore
          }
        }
      }
    } catch (e) {
      const msg = 'Pipeline error: ' + (e?.message || 'Unknown error');
      setStatusMsg(msg);
      setErrorMsg(msg);
      setPipelineRunning(false);
    }
    // Clear attachment after send
    setAttachment(null);
  };

  const handleUploadClick = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
          // For demo: use a temporary blob URL. Replace with AWS S3 upload later.
          const url = URL.createObjectURL(file);
          setAttachment({ url, name: file.name });
        } finally {
          setUploading(false);
        }
      };
      input.click();
    } catch {}
  };

  // Skip auth for now - create a demo user
  const demoUser = { id: 'demo_user', username: 'Demo User' };
  const demoToken = 'demo_token';

  const cameraProps = useMemo(() => ({ position: [5, 5, 8], fov: 50 }), []);

  // Export helpers
  const handleExport = (format) => {
    if (format === 'json') {
      const sJson = {
        id: currentScene?.id || null,
        name: currentScene?.name || 'Untitled Scene',
        objects: sceneObjects.map(o => ({
          id: o.id,
          type: o.object,
          position: o.position,
          rotation: o.rotation,
          dimensions: o.dimensions,
          material: o.material,
        })),
        groups: sceneGroups,
        exported_at: new Date().toISOString(),
      };
      // Console log as requested
      // eslint-disable-next-line no-console
      console.log('sJson export:', JSON.stringify(sJson, null, 2));
    }
  };

  // No-op live updates during drag to avoid re-render interruptions; update occurs on release

  // Debounced autosave when scene objects change
  useEffect(() => {
    if (!currentScene) return;
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/scenes/${currentScene.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: currentScene.name || 'Untitled Scene',
            objects: sceneObjects,
            groups: sceneGroups,
          })
        });
      } catch (e) {
        console.warn('Autosave failed', e);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [sceneObjects, sceneGroups, currentScene]);

  return (
    <div className={styles.editorContainer} ref={containerRef}>
      <Topbar onExport={handleExport} />
      {/* Quick Save Buttons moved into toolbar */}
      
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
          <button 
            className={styles.toolbarBtn}
            onClick={() => addPrimitive('cube')}
            title="Add Cube"
          >
            <FiBox />
          </button>
          <button 
            className={styles.toolbarBtn}
            onClick={() => addPrimitive('sphere')}
            title="Add Sphere"
          >
            <FiCircle />
          </button>
          <button 
            className={styles.toolbarBtn}
            onClick={() => addPrimitive('cylinder')}
            title="Add Cylinder"
          >
            <FiMaximize2 />
          </button>
          <button 
            className={styles.toolbarBtn}
            onClick={() => addPrimitive('plane')}
            title="Add Plane"
          >
            <FiSquare />
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

        <div className={styles.toolbarSpacer} />

        <div className={styles.toolbarSection}>
          <button 
            className={styles.actionBtn}
            onClick={saveCurrentScene}
            title={currentScene ? 'Save (updates current scene)' : 'Save (will create a new scene)'}
          >
            <FiSave />
            <span>Save</span>
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.secondary}`}
            onClick={saveAsNewScene}
            title="Save As (creates a new scene)"
          >
            <FiDownload />
            <span>Save As</span>
          </button>
        </div>

        <div className={styles.toolbarSection}>
          {/* Collaborators inline avatars */}
          <UserStatus compact />
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout}>
        {/* Left Panel - Scene Info */}
        {showOutliner && (
          <div className={styles.leftPanel} style={{ flex: `0 0 ${Math.round(leftPanelWidth * 100)}%` }}>
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
            {/* Resizer handle */}
            <div 
              className={styles.resizerHandle}
              onMouseDown={startResize}
              title="Drag to resize"
            />
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
              <button onClick={toggleTheme} className={theme === 'light' ? styles.active : ''} title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                {theme === 'light' ? <FiSun /> : <FiMoon />}
              </button>
            </div>
          </div>
          
          <div className={styles.viewport}>
            {/* Click empty space to deselect */}
            <Canvas 
              shadows 
              camera={{ position: [5, 5, 8], fov: 50 }}
              onPointerMissed={(e) => {
                // Deselect when clicking empty space
                if (!isTransforming) setSelectedId(null);
              }}
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
              
              {showGrid && <Grid args={[gridSize, gridDivisions]} position={[0, 0, 0]} />}
              {showAxes && <axesHelper args={[Math.max(3, gridSize / 2)]} />}
              
              {sceneObjects.map((o) => (
                <SelectableMesh
                  key={o.id}
                  o={o}
                  updateObject={updateObjectField}
                  onTransformChange={undefined}
                  onTransformStart={() => setIsTransforming(true)}
                  onTransformEnd={() => setIsTransforming(false)}
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
                  updateChild={(groupId, childId, field, value) => {
                    const updated = sceneGroups.map(grp => {
                      if (grp.id !== groupId) return grp;
                      const ch = (grp.children || []).map(o => {
                        if (o.id !== childId) return o;
                        const copy = { ...o };
                        if (["position", "rotation", "dimensions"].includes(field)) {
                          copy[field] = value.split(",").map(Number);
                        } else {
                          copy[field] = value;
                        }
                        return copy;
                      });
                      return { ...grp, children: ch };
                    });
                    setSceneGroups(updated);
                  }}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                />
              ))}

              {/* Render voxel groups if present (movable like normal groups) */}
              {sceneGroups.filter(g => g.type === 'voxel' && g.voxel).map((g) => {
                const isSelected = selectedId === g.id;
                return (
                  <TransformControls
                    key={`${g.id}_voxelwrap`}
                    enabled={isSelected}
                    mode="translate"
                    onMouseUp={(e) => {
                      const obj = e?.target?.object;
                      const pos = obj?.position;
                      if (pos) {
                        const updated = sceneGroups.map((x) => x.id === g.id ? { ...x, position: [pos.x, pos.y, pos.z] } : x);
                        setSceneGroups(updated);
                      }
                    }}
                  >
                    <group position={g.position || [0,0,0]}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(g.id); }}>
                      <VoxelInstanced voxel={g.voxel} />
                    </group>
                  </TransformControls>
                );
              })}

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
            {statusMsg && (
              <div className={styles.statusBar}>
                {statusMsg}
              </div>
            )}
            <div className={styles.chatBody} ref={chatBodyRef}>
              {chatLog.length === 0 ? (
                <p>Ask AI for help with modeling, materials, and more.</p>
              ) : (
                chatLog.map((m) => (
                  <div key={m.id} className={`${styles.chatBubble} ${m.role === 'user' ? styles.fromUser : styles.fromAgent}`}>
                    <div className={styles.roleLabel}>{m.role === 'user' ? 'You' : 'Agent'}</div>
                    <div className={`${styles.messageText} ${m.variant === 'success' ? styles.messageSuccess : ''}`}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              {attachment && (
                <div className={`${styles.chatBubble} ${styles.fromUser}`}>
                  <div className={styles.roleLabel}>Attachment</div>
                  <div className={styles.attachmentPreview}>
                    <img src={attachment.url} alt={attachment.name} className={styles.attachmentThumb} />
                    <div>{attachment.name || 'Image'}</div>
                  </div>
                </div>
              )}
              {errorMsg && (
                <div className={`${styles.chatBubble} ${styles.fromAgent}`}>
                  <div className={styles.roleLabel}>Agent</div>
                  <div className={`${styles.messageText} ${styles.messageError}`}>{errorMsg}</div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    <button className={styles.chatSendBtn} onClick={() => setErrorMsg("")}>Dismiss</button>
                    <button className={styles.chatSendBtn} onClick={() => { setErrorMsg(""); setChatInput(''); }}>New Prompt</button>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.chatInputBar}>
              <button className={styles.chatSendBtn} onClick={handleUploadClick} title="Add image" disabled={uploading} style={{ minWidth: 40 }}>
                {uploading ? '...' : '+'}
              </button>
              <input 
                className={styles.chatInput} 
                placeholder="Type a prompt..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleChatSend(); }}
              />
              <button className={styles.chatSendBtn} onClick={handleChatSend}>Send</button>
            </div>
          </div>
        )}

        {!showChat && (
          <button className={styles.chatFloatingBtn} onClick={() => setShowChat(true)}>Show Chat</button>
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
