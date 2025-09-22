"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  useEffect(() => {
    // Redirect to landing page
    router.push('/landing');
  }, [router]);

  return null;
}
