"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Sparkles, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function AnimatedStars() {
  const ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 50;
      ref.current.rotation.y -= delta / 30;
    }
  });

  return (
    <group ref={ref}>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.2} color="#00f3ff" />
      <Sparkles count={100} scale={10} size={3} speed={0.2} opacity={0.1} color="#bc13fe" />
    </group>
  );
}

export default function ThreeBackground() {
  return (
    <div className="w-full h-full absolute inset-0 z-[-1] bg-gradient-to-b from-black via-[#050510] to-black">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <AnimatedStars />
        <ambientLight intensity={0.5} />
      </Canvas>
    </div>
  );
}
