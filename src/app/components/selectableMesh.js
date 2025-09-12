"use client";

import React, { useRef, useEffect } from "react";
import { TransformControls } from "@react-three/drei";

/**
 * A mesh that can be selected, highlighted, and moved around
 */
export default function SelectableMesh({ o, updateObject, selectedId, setSelectedId }) {
  const ref = useRef();
  const isSelected = selectedId === o.id;

  useEffect(() => {
    if (ref.current && isSelected) {
      const { x, y, z } = ref.current.position;
      updateObject(o.id, "position", `${x},${y},${z}`);
    }
  }, [isSelected]);

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
