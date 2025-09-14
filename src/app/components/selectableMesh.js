"use client";

import React, { useRef, useEffect, useState } from "react";
import { TransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

/**
 * Edge handle component for resizing
 */
function EdgeHandle({ position, direction, onDrag, color = "#ff6b6b" }) {
  const ref = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { camera, raycaster, mouse } = useThree();

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    
    // Calculate mouse movement in world space
    const deltaX = e.movementX || 0;
    const deltaY = e.movementY || 0;
    
    // Convert screen delta to world delta based on camera distance
    const distance = camera.position.distanceTo(ref.current.position);
    const fov = camera.fov * Math.PI / 180;
    const height = 2 * Math.tan(fov / 2) * distance;
    const width = height * camera.aspect;
    
    const worldDelta = {
      x: (deltaX / window.innerWidth) * width,
      y: -(deltaY / window.innerHeight) * height, // Invert Y for proper direction
      z: 0
    };

    onDrag(direction, worldDelta);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging]);

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <boxGeometry args={[0.15, 0.15, 0.15]} />
      <meshBasicMaterial 
        color={isHovered ? "#ffffff" : color} 
        opacity={isDragging ? 0.8 : 0.9}
        transparent
      />
    </mesh>
  );
}

/**
 * A mesh that can be selected, highlighted, and moved around
 */
export default function SelectableMesh({ o, updateObject, selectedId, setSelectedId }) {
  const ref = useRef();
  const isSelected = selectedId === o.id;
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (ref.current && isSelected) {
      const { x, y, z } = ref.current.position;
      updateObject(o.id, "position", `${x},${y},${z}`);
    }
  }, [isSelected]);

  const handleEdgeDrag = (direction, delta) => {
    if (!ref.current) return;
    
    const currentDimensions = [...o.dimensions];
    const scale = 0.5; // Sensitivity of resize
    
    if (o.object === 'sphere') {
      // For spheres, all directions affect the radius (dimensions[0])
      const radiusChange = Math.abs(delta.x) + Math.abs(delta.y) + Math.abs(delta.z);
      currentDimensions[0] = Math.max(0.1, currentDimensions[0] + radiusChange * scale);
    } else if (o.object === 'cylinder') {
      // For cylinders, x and z affect radius, y affects height
      if (direction === 'x' || direction === 'z') {
        currentDimensions[0] = Math.max(0.1, currentDimensions[0] + Math.abs(delta.x + delta.z) * scale);
      } else if (direction === 'y') {
        currentDimensions[1] = Math.max(0.1, currentDimensions[1] + delta.y * scale);
      }
    } else {
      // For cubes/boxes, each direction affects its corresponding dimension
      if (direction === 'x') {
        currentDimensions[0] = Math.max(0.1, currentDimensions[0] + delta.x * scale);
      } else if (direction === 'y') {
        currentDimensions[1] = Math.max(0.1, currentDimensions[1] + delta.y * scale);
      } else if (direction === 'z') {
        currentDimensions[2] = Math.max(0.1, currentDimensions[2] + delta.z * scale);
      }
    }
    
    updateObject(o.id, "dimensions", currentDimensions.join(","));
  };

  const getEdgeHandles = () => {
    if (!isSelected) return null;
    
    if (o.object === 'sphere') {
      // For spheres, only show radius handles
      const radius = o.dimensions[0] / 2;
      return (
        <group>
          <EdgeHandle
            position={[radius + 0.1, 0, 0]}
            direction="x"
            onDrag={handleEdgeDrag}
            color="#ff6b6b"
          />
          <EdgeHandle
            position={[0, radius + 0.1, 0]}
            direction="y"
            onDrag={handleEdgeDrag}
            color="#4ecdc4"
          />
          <EdgeHandle
            position={[0, 0, radius + 0.1]}
            direction="z"
            onDrag={handleEdgeDrag}
            color="#45b7d1"
          />
        </group>
      );
    }
    
    if (o.object === 'cylinder') {
      // For cylinders, show radius and height handles
      const radius = o.dimensions[0] / 2;
      const height = o.dimensions[1];
      const halfHeight = height / 2;
      
      return (
        <group>
          {/* Radius handles */}
          <EdgeHandle
            position={[radius + 0.1, 0, 0]}
            direction="x"
            onDrag={handleEdgeDrag}
            color="#ff6b6b"
          />
          <EdgeHandle
            position={[0, 0, radius + 0.1]}
            direction="z"
            onDrag={handleEdgeDrag}
            color="#45b7d1"
          />
          
          {/* Height handles */}
          <EdgeHandle
            position={[0, -halfHeight - 0.1, 0]}
            direction="y"
            onDrag={handleEdgeDrag}
            color="#4ecdc4"
          />
          <EdgeHandle
            position={[0, halfHeight + 0.1, 0]}
            direction="y"
            onDrag={handleEdgeDrag}
            color="#4ecdc4"
          />
        </group>
      );
    }
    
    // For cubes/boxes
    const [width, height, depth] = o.dimensions;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;
    
    return (
      <group>
        {/* X-axis handles (left and right) */}
        <EdgeHandle
          position={[-halfWidth - 0.1, 0, 0]}
          direction="x"
          onDrag={handleEdgeDrag}
          color="#ff6b6b"
        />
        <EdgeHandle
          position={[halfWidth + 0.1, 0, 0]}
          direction="x"
          onDrag={handleEdgeDrag}
          color="#ff6b6b"
        />
        
        {/* Y-axis handles (top and bottom) */}
        <EdgeHandle
          position={[0, -halfHeight - 0.1, 0]}
          direction="y"
          onDrag={handleEdgeDrag}
          color="#4ecdc4"
        />
        <EdgeHandle
          position={[0, halfHeight + 0.1, 0]}
          direction="y"
          onDrag={handleEdgeDrag}
          color="#4ecdc4"
        />
        
        {/* Z-axis handles (front and back) */}
        <EdgeHandle
          position={[0, 0, -halfDepth - 0.1]}
          direction="z"
          onDrag={handleEdgeDrag}
          color="#45b7d1"
        />
        <EdgeHandle
          position={[0, 0, halfDepth + 0.1]}
          direction="z"
          onDrag={handleEdgeDrag}
          color="#45b7d1"
        />
      </group>
    );
  };

  const geom =
    o.object === "sphere" ? (
      <sphereGeometry args={[o.dimensions[0] / 2 || 0.5, 32, 32]} />
    ) : o.object === "cylinder" ? (
      <cylinderGeometry
        args={[
          o.dimensions[0] / 2 || 0.25,
          o.dimensions[0] / 2 || 0.25,
          o.dimensions[1] || 1,
          32,
        ]}
      />
    ) : (
      <boxGeometry
        args={[
          o.dimensions[0] || 1,
          o.dimensions[1] || 1,
          o.dimensions[2] || 1,
        ]}
      />
    );

  const mesh = (
    <group>
      <mesh
        ref={ref}
        position={o.position || [0, (o.dimensions?.[1] || 1) / 2, 0]}
        rotation={o.rotation || [0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(o.id);
        }}
        castShadow
        receiveShadow
      >
        {geom}
        <meshStandardMaterial
          color={isSelected ? "#a855f7" : o.material || "#888888"}
          emissive={isSelected ? "#a855f7" : "black"}
          emissiveIntensity={isSelected ? 0.4 : 0}
        />
      </mesh>
      {getEdgeHandles()}
    </group>
  );

  // If selected → wrap in TransformControls
  return isSelected ? (
    <TransformControls
      object={ref.current}
      mode="translate"
      onMouseUp={() => {
        if (ref.current) {
          const { x, y, z } = ref.current.position;
          updateObject(o.id, "position", `${x},${y},${z}`);
        }
      }}
    >
      {mesh}
    </TransformControls>
  ) : (
    mesh
  );
}
