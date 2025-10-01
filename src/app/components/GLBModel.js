import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

export default function GLBModel({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], ...props }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef();

  // Rotate the model if needed
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={scene.clone()}
      position={position}
      scale={scale}
      {...props}
    />
  );
}

// Preload the model
GLBModel.preload = (url) => {
  useGLTF.preload(url);
};
