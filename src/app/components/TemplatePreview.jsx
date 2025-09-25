"use client";

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sky, Environment, Text } from "@react-three/drei";
import { useRouter } from "next/navigation";
import styles from "./TemplatePreview.module.css";

// Simple tree component
function Tree({ position }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {/* Leaves */}
      <mesh ref={meshRef} position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.8, 8, 6]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
    </group>
  );
}

// Ground component
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#90EE90" />
    </mesh>
  );
}

// Player controller
function Player({ onClose }) {
  const { camera } = useThree();
  const [keys, setKeys] = useState({});
  const velocity = useRef([0, 0, 0]);
  const position = useRef([0, 0, 5]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      setKeys(prev => ({ ...prev, [event.code]: true }));
    };

    const handleKeyUp = (event) => {
      setKeys(prev => ({ ...prev, [event.code]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    const speed = 5;
    const moveSpeed = speed * delta;

    // Reset velocity
    velocity.current = [0, 0, 0];

    // WASD movement
    if (keys['KeyW']) velocity.current[2] -= moveSpeed;
    if (keys['KeyS']) velocity.current[2] += moveSpeed;
    if (keys['KeyA']) velocity.current[0] -= moveSpeed;
    if (keys['KeyD']) velocity.current[0] += moveSpeed;

    // Update position
    position.current[0] += velocity.current[0];
    position.current[2] += velocity.current[2];

    // Update camera position
    camera.position.set(position.current[0], 2, position.current[2]);
    camera.lookAt(position.current[0], 2, position.current[2] - 1);
  });

  return null;
}

// Floating UI
function FloatingUI({ templateName, onClose, onStartProject }) {
  return (
    <div className={styles.floatingUI}>
      <div className={styles.uiContent}>
        <h2 className={styles.templateTitle}>{templateName}</h2>
        <p className={styles.instructions}>Use WASD to move around</p>
        <div className={styles.buttons}>
          <button className={styles.startButton} onClick={onStartProject}>
            Start Project
          </button>
          <button className={styles.closeButton} onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatePreview({ template, onClose, onStartProject }) {
  const router = useRouter();

  const handleStartProject = () => {
    onStartProject(template);
  };

  // Generate random tree positions
  const trees = Array.from({ length: 20 }, (_, i) => ({
    position: [
      (Math.random() - 0.5) * 40,
      0,
      (Math.random() - 0.5) * 40
    ]
  }));

  return (
    <div className={styles.previewContainer}>
      <Canvas
        camera={{ position: [0, 2, 5], fov: 75 }}
        style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%)' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Sky
          distance={450000}
          sunPosition={[0, 1, 0]}
          inclination={0}
          azimuth={0.25}
        />
        
        <Environment preset="sunset" />
        
        <Ground />
        
        {trees.map((tree, index) => (
          <Tree key={index} position={tree.position} />
        ))}
        
        <Player onClose={onClose} />
        
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
      
      <FloatingUI
        templateName={template.name}
        onClose={onClose}
        onStartProject={handleStartProject}
      />
    </div>
  );
}
