"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./editor.module.css";

function storageKey(projectId) {
  return `brew3d:project:${projectId}:scenes`;
}

function readScenes(projectId) {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeScenes(projectId, scenes) {
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(scenes));
  } catch {}
}

export default function SceneEditorPage() {
  const { id, sceneId } = useParams();
  const router = useRouter();
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [scene, setScene] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [showProperties, setShowProperties] = useState(true);

  useEffect(() => {
    const scenes = readScenes(id);
    const currentScene = scenes.find(s => s.id === sceneId);
    if (currentScene) {
      setScene(currentScene);
    } else {
      router.push(`/dashboard/projects/${id}/scenes`);
    }
  }, [id, sceneId, router]);

  useEffect(() => {
    if (!scene || !canvasRef.current || !scene.objects) return;

    // Initialize Three.js scene
    const initThreeJS = async () => {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

      const canvas = canvasRef.current;
      const threeScene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setClearColor(0x1a1a1a);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404040, scene.lighting?.ambient || 0.6);
      threeScene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, scene.lighting?.directional || 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      threeScene.add(directionalLight);

      // Ground plane
      const groundGeometry = new THREE.PlaneGeometry(20, 20);
      const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      threeScene.add(ground);

      // Grid helper
      const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444);
      threeScene.add(gridHelper);

      // Camera position
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 0, 0);

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      // Add default objects if scene is empty
      if (scene.objects && scene.objects.length === 0) {
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(0, 0.5, 0);
        cube.castShadow = true;
        threeScene.add(cube);

        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(2, 0.5, 0);
        sphere.castShadow = true;
        threeScene.add(sphere);
      }

      sceneRef.current = threeScene;
      rendererRef.current = renderer;
      cameraRef.current = camera;
      controlsRef.current = controls;

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(threeScene, camera);
      };
      animate();

      // Handle resize
      const handleResize = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
      };
    };

    initThreeJS();
  }, [scene]);

  const addObject = (type) => {
    if (!scene) return;
    
    const newObject = {
      id: crypto.randomUUID(),
      type,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#6b4423'
    };

    const updatedScene = {
      ...scene,
      objects: [...(scene.objects || []), newObject],
      lastModified: Date.now()
    };

    setScene(updatedScene);
    
    const scenes = readScenes(id);
    const updatedScenes = scenes.map(s => s.id === sceneId ? updatedScene : s);
    writeScenes(id, updatedScenes);
  };

  const deleteObject = (objectId) => {
    if (!scene || !scene.objects) return;
    
    const updatedScene = {
      ...scene,
      objects: scene.objects.filter(obj => obj.id !== objectId),
      lastModified: Date.now()
    };

    setScene(updatedScene);
    
    const scenes = readScenes(id);
    const updatedScenes = scenes.map(s => s.id === sceneId ? updatedScene : s);
    writeScenes(id, updatedScenes);
  };

  if (!scene) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading scene...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/dashboard/projects/${id}/scenes`)}>
          ← Back to Scenes
        </button>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{scene.name}</h1>
          <div className={styles.controls}>
            <button 
              className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button 
              className={styles.propertiesButton}
              onClick={() => setShowProperties(!showProperties)}
            >
              {showProperties ? 'Hide Properties' : 'Show Properties'}
            </button>
          </div>
        </div>
      </header>

      <div className={styles.editorLayout}>
        <div className={styles.viewport}>
          <canvas ref={canvasRef} className={styles.canvas} />
          <div className={styles.viewportOverlay}>
            <div className={styles.toolbar}>
              <div className={styles.objectTools}>
                <button className={styles.toolButton} onClick={() => addObject('cube')}>
                  📦 Cube
                </button>
                <button className={styles.toolButton} onClick={() => addObject('sphere')}>
                  ⚪ Sphere
                </button>
                <button className={styles.toolButton} onClick={() => addObject('cylinder')}>
                  🥤 Cylinder
                </button>
                <button className={styles.toolButton} onClick={() => addObject('plane')}>
                  📄 Plane
                </button>
              </div>
              <div className={styles.viewportInfo}>
                <span>Objects: {scene.objects?.length || 0}</span>
                <span>FPS: 60</span>
              </div>
            </div>
          </div>
        </div>

        {showProperties && (
          <div className={styles.propertiesPanel}>
            <h3>Scene Properties</h3>
            <div className={styles.propertyGroup}>
              <label>Scene Name</label>
              <input 
                type="text" 
                value={scene.name}
                onChange={(e) => {
                  const updated = { ...scene, name: e.target.value, lastModified: Date.now() };
                  setScene(updated);
                  const scenes = readScenes(id);
                  const updatedScenes = scenes.map(s => s.id === sceneId ? updated : s);
                  writeScenes(id, updatedScenes);
                }}
                className={styles.input}
              />
            </div>
            
            <div className={styles.propertyGroup}>
              <label>Ambient Light</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={scene.lighting.ambient}
                onChange={(e) => {
                  const updated = { 
                    ...scene, 
                    lighting: { ...scene.lighting, ambient: parseFloat(e.target.value) },
                    lastModified: Date.now()
                  };
                  setScene(updated);
                  const scenes = readScenes(id);
                  const updatedScenes = scenes.map(s => s.id === sceneId ? updated : s);
                  writeScenes(id, updatedScenes);
                }}
                className={styles.slider}
              />
              <span>{scene.lighting.ambient}</span>
            </div>

            <div className={styles.propertyGroup}>
              <label>Directional Light</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={scene.lighting.directional}
                onChange={(e) => {
                  const updated = { 
                    ...scene, 
                    lighting: { ...scene.lighting, directional: parseFloat(e.target.value) },
                    lastModified: Date.now()
                  };
                  setScene(updated);
                  const scenes = readScenes(id);
                  const updatedScenes = scenes.map(s => s.id === sceneId ? updated : s);
                  writeScenes(id, updatedScenes);
                }}
                className={styles.slider}
              />
              <span>{scene.lighting.directional}</span>
            </div>

            <h3>Objects</h3>
            <div className={styles.objectsList}>
              {(scene.objects || []).map((obj) => (
                <div key={obj.id} className={styles.objectItem}>
                  <div className={styles.objectInfo}>
                    <span className={styles.objectType}>{obj.type}</span>
                    <span className={styles.objectId}>{obj.id.slice(0, 8)}</span>
                  </div>
                  <button 
                    className={styles.deleteButton}
                    onClick={() => deleteObject(obj.id)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
