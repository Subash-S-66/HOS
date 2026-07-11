"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function Nebula() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      mesh.current.rotation.z = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, -10]}>
      <sphereGeometry args={[15, 32, 32]} />
      <meshBasicMaterial
        color="#0a192f"
        transparent
        opacity={0.3}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function Grid() {
  return (
    <gridHelper
      args={[100, 100, '#00ff66', '#ffffff']}
      position={[0, -10, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-[-1] bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0a0a1a] via-black to-black opacity-80 mix-blend-multiply z-10 pointer-events-none"></div>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} color="#00ff66" intensity={2} />
        <pointLight position={[-10, -10, -10]} color="#a855f7" intensity={1} />

        <Stars radius={100} depth={50} count={2500} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={100} scale={12} size={2} speed={0.4} opacity={0.2} color="#00ff66" />
        <Sparkles count={50} scale={10} size={3} speed={0.2} opacity={0.1} color="#a855f7" />

        <Nebula />
        <Grid />

        <fog attach="fog" args={['#000000', 5, 30]} />
      </Canvas>
    </div>
  );
}
