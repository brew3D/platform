"use client";

import React, { useRef, useEffect } from "react";
import { TransformControls } from "@react-three/drei";
import SelectableMesh from "./selectableMesh";

export default function GroupMesh({ group, updateGroup, updateChild, selectedId, setSelectedId }) {
  const ref = useRef();
  const isSelected = selectedId === group.id;

  useEffect(() => {
    if (ref.current && isSelected) {
      const { x, y, z } = ref.current.position;
      updateGroup(group.id, [x, y, z]);
    }
  }, [isSelected]);

  return (
    <TransformControls
      enabled={isSelected}
      mode="translate"
      onMouseUp={() => {
        if (ref.current) {
          const { x, y, z } = ref.current.position;
          updateGroup(group.id, [x, y, z]);
        }
      }}
    >
      <group
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(group.id);
        }}
      >
        {Array.isArray(group.children) && group.children.map((o) => (
          <SelectableMesh
            key={o.id}
            o={o}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            updateObject={(id, field, value) => updateChild?.(group.id, id, field, value)}
            isInGroup={true}
          />
        ))}
      </group>
    </TransformControls>
  );
}
