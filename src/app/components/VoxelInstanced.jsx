"use client";

import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

// voxel = { palette: string[] (hex or names), voxels: Array<{x:number,y:number,z:number,c:number,size?:number}> }
export default function VoxelInstanced({ voxel, position = [0,0,0] }) {
  const ref = useRef();
  const { scene } = useThree();

  const { mesh, count } = useMemo(() => {
    const vox = Array.isArray(voxel?.voxels) ? voxel.voxels : [];
    const rawPalette = Array.isArray(voxel?.palette) ? voxel.palette : [];
    // Sanitize palette colors
    const palette = rawPalette.map((c) => {
      try {
        return new THREE.Color(c);
      } catch {
        return new THREE.Color('#999999');
      }
    });

    const instanceCount = vox.length;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.0 });
    const instanced = new THREE.InstancedMesh(geometry, material, instanceCount);
    const dummy = new THREE.Object3D();

    // Compute bounding box to normalize and center
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < instanceCount; i++) {
      const v = vox[i];
      if (!v) continue;
      const sx = Number(v.size || 1), sy = Number(v.size || 1), sz = Number(v.size || 1);
      minX = Math.min(minX, v.x);
      minY = Math.min(minY, v.y);
      minZ = Math.min(minZ, v.z);
      maxX = Math.max(maxX, v.x + sx);
      maxY = Math.max(maxY, v.y + sy);
      maxZ = Math.max(maxZ, v.z + sz);
    }
    if (!isFinite(minX)) {
      return { mesh: instanced, count: 0 };
    }
    const sizeX = Math.max(1, maxX - minX);
    const sizeY = Math.max(1, maxY - minY);
    const sizeZ = Math.max(1, maxZ - minZ);
    const maxDim = Math.max(sizeX, sizeY, sizeZ);
    // Target the largest dimension to be ~4 world units
    const target = 4;
    const scaleN = target / maxDim;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;

    const colorScratch = new THREE.Color();
    for (let i = 0; i < instanceCount; i++) {
      const v = vox[i];
      if (!v) continue;
      const baseSize = Math.max(0.05, Number(v.size || 1));
      const size = baseSize * scaleN;
      dummy.position.set((v.x - cx) * scaleN, (v.y - cy) * scaleN, (v.z - cz) * scaleN);
      dummy.scale.set(size, size, size);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
      const clr = palette[v.c] || colorScratch.set('#999999');
      instanced.setColorAt(i, clr);
    }
    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
    return { mesh: instanced, count: instanceCount };
  }, [voxel]);

  useEffect(() => {
    const group = ref.current;
    if (!group || !mesh) return;
    // Attach built instanced mesh to this group
    group.add(mesh);
    return () => {
      try {
        if (group && mesh && mesh.parent === group) {
          group.remove(mesh);
        }
        if (mesh?.geometry) mesh.geometry.dispose?.();
        if (mesh?.material) mesh.material.dispose?.();
      } catch {}
    };
  }, [mesh]);

  return (
    <group ref={ref} position={position} />
  );
}


