import { useRef, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface AtomProps {
  position: [number, number, number];
  color: string;
  size?: number;
  emissive?: string;
  emissiveIntensity?: number;
}

function Atom({ position, color, size = 0.3, emissive, emissiveIntensity = 0.5 }: AtomProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // More dynamic pulsing effect
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.08;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.1} 
        metalness={0.9}
        emissive={emissive || color}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

interface BondProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
}

function Bond({ start, end, color = '#5a9fd4' }: BondProps) {
  const ref = useRef<THREE.Mesh>(null);
  
  const { position, rotation, length } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(endVec, startVec);
    const length = direction.length();
    
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    
    return {
      position: midPoint.toArray() as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      length
    };
  }, [start, end]);

  useFrame((state) => {
    if (ref.current) {
      // Subtle glow pulsing
      const material = ref.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
    }
  });

  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <cylinderGeometry args={[0.04, 0.04, length, 12]} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.2} 
        metalness={0.8}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// Simplified particles - no per-frame position updates for better performance
const FloatingParticles = memo(function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const { positions, colors } = useMemo(() => {
    const count = 80; // Reduced count for performance
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      
      const hue = 0.55 + Math.random() * 0.1;
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors };
  }, []);

  // Simple rotation only - no position updates
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={80}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={80}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
});

// Simplified orbiting electron - no Trail for performance
const OrbitingElectron = memo(function OrbitingElectron({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime * speed;
      ref.current.position.x = Math.cos(t) * radius;
      ref.current.position.z = Math.sin(t) * radius;
      ref.current.position.y = Math.sin(t * 0.5) * 0.3;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.08, 12, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
      />
    </mesh>
  );
});

function Molecule() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Smoother, more elegant rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.12;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.25;
    }
  });

  // Water molecule structure (H2O) - center
  const waterAtoms: AtomProps[] = [
    { position: [0, 0, 0], color: '#ef4444', size: 0.55, emissive: '#ef4444', emissiveIntensity: 0.5 }, // Oxygen (red)
    { position: [0.8, 0.6, 0], color: '#ffffff', size: 0.35, emissive: '#60a5fa', emissiveIntensity: 0.7 }, // Hydrogen
    { position: [-0.8, 0.6, 0], color: '#ffffff', size: 0.35, emissive: '#60a5fa', emissiveIntensity: 0.7 }, // Hydrogen
  ];

  // Additional decorative molecules
  const extraAtoms: AtomProps[] = [
    // Carbon dioxide molecule (left)
    { position: [-2.5, -0.5, 0.5], color: '#374151', size: 0.45, emissive: '#60a5fa', emissiveIntensity: 0.4 },
    { position: [-3.5, -0.5, 0.5], color: '#ef4444', size: 0.4, emissive: '#ef4444', emissiveIntensity: 0.5 },
    { position: [-1.5, -0.5, 0.5], color: '#ef4444', size: 0.4, emissive: '#ef4444', emissiveIntensity: 0.5 },
    
    // Methane-like (right top)
    { position: [2.5, 1, -0.5], color: '#374151', size: 0.5, emissive: '#22c55e', emissiveIntensity: 0.5 },
    { position: [3.2, 1.5, -0.2], color: '#ffffff', size: 0.3, emissive: '#60a5fa', emissiveIntensity: 0.6 },
    { position: [1.8, 1.5, -0.2], color: '#ffffff', size: 0.3, emissive: '#60a5fa', emissiveIntensity: 0.6 },
    { position: [2.5, 0.3, -0.8], color: '#ffffff', size: 0.3, emissive: '#60a5fa', emissiveIntensity: 0.6 },
    { position: [2.5, 0.5, 0.3], color: '#ffffff', size: 0.3, emissive: '#60a5fa', emissiveIntensity: 0.6 },
  ];

  // Bonds
  const bonds: { start: [number, number, number]; end: [number, number, number] }[] = [
    // Water bonds
    { start: [0, 0, 0], end: [0.8, 0.6, 0] },
    { start: [0, 0, 0], end: [-0.8, 0.6, 0] },
    // CO2 bonds
    { start: [-2.5, -0.5, 0.5], end: [-3.5, -0.5, 0.5] },
    { start: [-2.5, -0.5, 0.5], end: [-1.5, -0.5, 0.5] },
    // Methane bonds
    { start: [2.5, 1, -0.5], end: [3.2, 1.5, -0.2] },
    { start: [2.5, 1, -0.5], end: [1.8, 1.5, -0.2] },
    { start: [2.5, 1, -0.5], end: [2.5, 0.3, -0.8] },
    { start: [2.5, 1, -0.5], end: [2.5, 0.5, 0.3] },
  ];

  return (
    <group ref={groupRef}>
      {/* Orbiting electrons for visual effect */}
      <OrbitingElectron radius={1.5} speed={2} color="#60a5fa" />
      <OrbitingElectron radius={2} speed={1.5} color="#3b82f6" />
      <OrbitingElectron radius={2.5} speed={1} color="#2563eb" />
      
      {/* Render bonds first (behind atoms) */}
      {bonds.map((bond, i) => (
        <Bond key={`bond-${i}`} {...bond} />
      ))}
      
      {/* Water molecule */}
      {waterAtoms.map((atom, i) => (
        <Float key={`water-${i}`} speed={2.5} rotationIntensity={0.25} floatIntensity={0.4}>
          <Atom {...atom} />
        </Float>
      ))}
      
      {/* Extra molecules */}
      {extraAtoms.map((atom, i) => (
        <Float key={`extra-${i}`} speed={1.8} rotationIntensity={0.15} floatIntensity={0.25}>
          <Atom {...atom} />
        </Float>
      ))}
    </group>
  );
}

function GlowingSphere() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      // More dynamic breathing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
      ref.current.scale.setScalar(scale);
      ref.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <Sphere ref={ref} args={[3.5, 64, 64]} position={[0, 0, -4]}>
      <MeshDistortMaterial
        color="#3b82f6"
        attach="material"
        distort={0.4}
        speed={2.5}
        roughness={0.3}
        transparent
        opacity={0.12}
      />
    </Sphere>
  );
}

export default memo(function MoleculeScene() {
  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden will-change-transform">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]} // Reduced max DPR for performance
        frameloop="always"
        gl={{ 
          antialias: false, // Disable for performance
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
      >
        {/* Simplified lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <pointLight position={[-5, 5, 5]} intensity={0.8} color="#3b82f6" />
        
        {/* Reduced stars */}
        <Stars radius={50} depth={50} count={150} factor={2} saturation={0.5} fade speed={0.3} />
        
        <GlowingSphere />
        <FloatingParticles />
        <Molecule />
      </Canvas>
      
      {/* Static glow overlay - no animations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/15 rounded-full blur-3xl opacity-60" />
      </div>
    </div>
  );
});
