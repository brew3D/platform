"use client";

import React, { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  PerspectiveCamera,
  TransformControls
} from "@react-three/drei";
import styles from "./Home.module.css";
import Topbar from "./Topbar";
import SelectableMesh from "./components/selectableMesh";
import GroupMesh from "./components/GroupMesh";

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

export default function Home() {
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

  const [sceneCode, setSceneCode] = useState(
    JSON.stringify({ objects: sceneObjects }, null, 2)
  );
  const [gridSize, setGridSize] = useState(10);
  const [sceneGroups, setSceneGroups] = useState([]);
  
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
    updateSceneFromObjects(objs);
  };

  const updateScene = (objs, grps) => {
    setSceneObjects(objs);
    setSceneGroups(grps);
    setSceneCode(JSON.stringify({ objects: objs, groups: grps }, null, 2));
  };



  const [gridDivisions, setGridDivisions] = useState(10);
  const [showAxes, setShowAxes] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isPromptOpen, setPromptOpen] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const updateSceneFromObjects = (objs) => {
    setSceneObjects(objs);
    setSceneCode(JSON.stringify({ objects: objs }, null, 2));
  };

  const applySceneCode = () => {
    try {
      const parsed = JSON.parse(sceneCode);
      if (parsed.objects && Array.isArray(parsed.objects)) {
        updateSceneFromObjects(parsed.objects);
      } else {
        alert("scene JSON must contain { objects: [ ... ] }");
      }
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  };

  const simulateAI = (text) => {
    const t = text.toLowerCase();
    if (t.includes("table")) {
      return [
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
      ];
    } else if (t.includes("chair")) {
      return [
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
      ];
    } else if (t.includes("sphere") || t.includes("ball")) {
      return [
        {
          id: "sphere_1",
          object: "sphere",
          dimensions: [1, 1, 1],
          position: [0, 0.5, 0],
          rotation: [0, 0, 0],
          material: "#2EC4B6",
        },
      ];
    } else {
      return [
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
      ];
    }
  };

  const handleGenerate = async () => {
    const generated = simulateAI(promptText || "two cubes");
    updateSceneFromObjects(generated);
    setPromptOpen(false);
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
    updateSceneFromObjects([...sceneObjects, newObj]);
  };

  const removeObject = (id) => {
    updateSceneFromObjects(sceneObjects.filter((o) => o.id !== id));
  };

  const cameraProps = useMemo(() => ({ position: [5, 5, 8], fov: 50 }), []);

  return (
    <div className={styles.page}>
      <Topbar />

      <main className={styles.main}>
        <section className={styles.left}>
          <div className={styles.leftHeader}>
            <div className={styles.leftTitle}>Scene Editor</div>
            <div className={styles.leftHeaderRight}>
              <button onClick={() => addPrimitive("cube")} className={styles.iconBtn}>+ Cube</button>
              <button onClick={() => addPrimitive("sphere")} className={styles.iconBtn}>+ Sphere</button>
              <button onClick={() => addPrimitive("cylinder")} className={styles.iconBtn}>+ Cylinder</button>
            </div>
          </div>

          <div className={styles.controlsRow}>
            <label className={styles.label}>Grid size</label>
            <input type="range" min={2} max={40} value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} />
            <span className={styles.smallText}>{gridSize}</span>
            <label className={styles.divisionsLabel}>Divisions</label>
            <input type="number" min={2} max={64} value={gridDivisions} onChange={(e) => setGridDivisions(Number(e.target.value))} className={styles.divisionsInput} />
          </div>

          <div className={styles.controlsRow}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> Show Grid
            </label>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={showAxes} onChange={(e) => setShowAxes(e.target.checked)} /> Show Axes
            </label>
            <button onClick={() => { setSceneObjects([]); setSceneCode('{ "objects": [] }'); }} className={styles.clearBtn}>Clear</button>
            <button onClick={applySceneCode} className={styles.applyBtn}>Apply JSON</button>
          </div>

          <div className={styles.editor}>
            <textarea value={sceneCode} onChange={(e) => setSceneCode(e.target.value)} className={styles.textarea} />
          </div>

          <div className={styles.objectList}>
            <div className={styles.objectListTitle}>Objects</div>
            <div className={styles.objectListInner}>
              {sceneObjects.map((o) => (
                <div key={o.id} className={styles.objectRow}>
                  <div className={styles.objectInfo}>
                    <div className={styles.objectId}>{o.id}</div>
                    <div className={styles.smallText}>{o.object} • pos: {o.position.map(n => n.toFixed(2)).join(", ")}</div>
                  </div>
                  <div className={styles.objectActions}>
                    <button onClick={() => removeObject(o.id)} className={styles.smallAction}>Remove</button>
                    <button onClick={() => {
                      const c = prompt("Set hex color (e.g. #ff00aa)", o.material || "#999");
                      if (c) updateSceneFromObjects(sceneObjects.map(x => x.id === o.id ? { ...x, material: c } : x));
                    }} className={styles.smallAction}>Color</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.right}>
          <Canvas shadows camera={{ position: [5, 5, 8], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={0.7} />
            <PerspectiveCamera makeDefault position={cameraProps.position} fov={cameraProps.fov} />
            <OrbitControls makeDefault />
            {showGrid && <Grid args={[gridSize, gridDivisions]} position={[0, 0, 0]} />}
            {showAxes && <axesHelper args={[Math.max(3, gridSize / 2)]} />}
            {sceneObjects.map((o) => (
              <SelectableMesh
                key={o.id}
                o={o}
                updateObject={updateObjectField}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
              />
            ))}

            {sceneGroups.map((g) => (
              <GroupMesh
                key={g.id}
                group={g}
                updateGroup={(id, pos) => {
                  // Apply offset to children if group moves
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
        </section>
      </main>

      <div className={`${styles.promptDrawer} ${isPromptOpen ? styles.promptOpen : ""}`}>
        <div className={styles.promptHeader}>
          <div className={styles.promptTitle}>Prompt · Chat with AI</div>
          <div className={styles.promptHeaderBtns}>
            <button onClick={() => setPromptOpen(false)} className={styles.smallAction}>Close</button>
            <button onClick={() => { setPromptText(""); }} className={styles.smallAction}>Clear</button>
          </div>
        </div>
        <textarea
          placeholder='e.g. "make me a wooden chair and a small round table"'
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          className={styles.promptArea}
        />
        <div className={styles.promptFooter}>
          <button onClick={() => { setPromptOpen(false); setPromptText(""); }} className={styles.ghostBtn}>Cancel</button>
          <button onClick={handleGenerate} className={styles.generateBtn}>Generate</button>
        </div>
      </div>

      <button onClick={() => setPromptOpen(true)} className={styles.floatingPromptBtn}>💬 Prompt</button>
    </div>
  );
}
