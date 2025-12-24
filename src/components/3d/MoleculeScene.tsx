import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface AtomProps {
  position: [number, number, number];
  color: string;
  size?: number;
  speed?: number;
}

const Atom: React.FC<AtomProps> = ({ position, color, size = 0.3, speed = 1 }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[size, 32, 32]} position={position}>
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </Sphere>
    </Float>
  );
};

const Molecule: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  const atoms: AtomProps[] = [
    { position: [0, 0, 0], color: '#1F4FD8', size: 0.5, speed: 0.5 },
    { position: [1.2, 0.8, 0], color: '#6FA8FF', size: 0.35, speed: 0.7 },
    { position: [-1.2, 0.8, 0], color: '#6FA8FF', size: 0.35, speed: 0.8 },
    { position: [0, -1, 0.8], color: '#6FA8FF', size: 0.35, speed: 0.6 },
    { position: [0, -1, -0.8], color: '#6FA8FF', size: 0.35, speed: 0.9 },
    { position: [2, -0.5, 1], color: '#1F4FD8', size: 0.4, speed: 0.4 },
    { position: [-2, -0.5, -1], color: '#1F4FD8', size: 0.4, speed: 0.5 },
  ];

  return (
    <group ref={groupRef}>
      {atoms.map((atom, i) => (
        <Atom key={i} {...atom} />
      ))}
    </group>
  );
};

const MoleculeScene: React.FC = () => {
  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#6FA8FF" />
        
        <Molecule />
      </Canvas>
      
      {/* Glow overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" />
      </div>
    </div>
  );
};

export default MoleculeScene;
