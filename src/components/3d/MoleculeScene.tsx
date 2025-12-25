import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
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
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
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

  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <cylinderGeometry args={[0.05, 0.05, length, 8]} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.3} 
        metalness={0.7}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.03) * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={100}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#5a9fd4"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function Molecule() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.15;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  // Water molecule structure (H2O) - center
  const waterAtoms: AtomProps[] = [
    { position: [0, 0, 0], color: '#ef4444', size: 0.55, emissive: '#ef4444', emissiveIntensity: 0.4 }, // Oxygen (red)
    { position: [0.8, 0.6, 0], color: '#ffffff', size: 0.35, emissive: '#3173b8', emissiveIntensity: 0.6 }, // Hydrogen
    { position: [-0.8, 0.6, 0], color: '#ffffff', size: 0.35, emissive: '#3173b8', emissiveIntensity: 0.6 }, // Hydrogen
  ];

  // Additional decorative molecules
  const extraAtoms: AtomProps[] = [
    // Carbon dioxide molecule (left)
    { position: [-2.5, -0.5, 0.5], color: '#4a4a4a', size: 0.45, emissive: '#3173b8', emissiveIntensity: 0.3 },
    { position: [-3.5, -0.5, 0.5], color: '#ef4444', size: 0.4, emissive: '#ef4444', emissiveIntensity: 0.4 },
    { position: [-1.5, -0.5, 0.5], color: '#ef4444', size: 0.4, emissive: '#ef4444', emissiveIntensity: 0.4 },
    
    // Methane-like (right top)
    { position: [2.5, 1, -0.5], color: '#4a4a4a', size: 0.5, emissive: '#22c55e', emissiveIntensity: 0.4 },
    { position: [3.2, 1.5, -0.2], color: '#ffffff', size: 0.3, emissive: '#3173b8', emissiveIntensity: 0.5 },
    { position: [1.8, 1.5, -0.2], color: '#ffffff', size: 0.3, emissive: '#3173b8', emissiveIntensity: 0.5 },
    { position: [2.5, 0.3, -0.8], color: '#ffffff', size: 0.3, emissive: '#3173b8', emissiveIntensity: 0.5 },
    { position: [2.5, 0.5, 0.3], color: '#ffffff', size: 0.3, emissive: '#3173b8', emissiveIntensity: 0.5 },
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
      {/* Render bonds first (behind atoms) */}
      {bonds.map((bond, i) => (
        <Bond key={`bond-${i}`} {...bond} />
      ))}
      
      {/* Water molecule */}
      {waterAtoms.map((atom, i) => (
        <Float key={`water-${i}`} speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
          <Atom {...atom} />
        </Float>
      ))}
      
      {/* Extra molecules */}
      {extraAtoms.map((atom, i) => (
        <Float key={`extra-${i}`} speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
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
      ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime) * 0.1);
    }
  });

  return (
    <Sphere ref={ref} args={[3.5, 64, 64]} position={[0, 0, -3]}>
      <MeshDistortMaterial
        color="#3173b8"
        attach="material"
        distort={0.3}
        speed={2}
        roughness={0.4}
        transparent
        opacity={0.1}
      />
    </Sphere>
  );
}

export default function MoleculeScene() {
  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-5, 5, 5]} intensity={0.8} color="#3173b8" />
        <pointLight position={[5, -5, -5]} intensity={0.6} color="#5a9fd4" />
        <spotLight position={[0, 10, 0]} intensity={0.5} color="#ffffff" angle={0.5} />
        
        <GlowingSphere />
        <FloatingParticles />
        <Molecule />
      </Canvas>
      
      {/* Glow overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-accent/20 rounded-full blur-2xl animate-pulse-glow animation-delay-300" />
      </div>
    </div>
  );
}