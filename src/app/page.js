"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box } from "@react-three/drei";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [sceneCode, setSceneCode] = useState("<empty scene>");

  const handleGenerate = async () => {
    // TODO: call backend API with prompt
    // For now, simulate with dummy URDF snippet
    setSceneCode(`
<link name="table">
  <visual>
    <geometry><box size="1 1 0.5"/></geometry>
    <origin xyz="1 0 0.25"/>
  </visual>
</link>`);
  };

  const handleExport = () => {
    const blob = new Blob([sceneCode], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scene.urdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main style={{ display: "flex", height: "100vh" }}>
      {/* Left: Editor */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 10, borderBottom: "1px solid #ccc", display: "flex", gap: 8 }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your scene (e.g. kitchen, 2 chairs)"
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={handleGenerate} style={{ padding: "8px 16px", backgroundColor: "#6B46C1", color: "#fff", border: "none", borderRadius: 4 }}>
            Generate
          </button>
        </div>
        <textarea
          value={sceneCode}
          readOnly
          style={{ flex: 1, padding: 10, fontFamily: "monospace", border: "none", outline: "none" }}
        />
        <button onClick={handleExport} style={{ padding: 10, backgroundColor: "#4A5568", color: "#fff", border: "none", cursor: "pointer" }}>
          Export URDF
        </button>
      </div>

      {/* Right: 3D Preview */}
      <div style={{ flex: 1 }}>
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <Box position={[0, 0.25, 0]}>
            <meshStandardMaterial color="orange" />
          </Box>
          <OrbitControls />
        </Canvas>
      </div>
    </main>
  );
}
