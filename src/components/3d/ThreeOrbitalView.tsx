'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Stars, Text, Line, Bounds, useBounds } from '@react-three/drei';
import * as THREE from 'three';
import { Group } from 'three';

interface ChainNodeProps {
    position: [number, number, number];
    color: string;
    label: string;
    size: number;
}

const ChainNode = ({ position, color, label, size }: ChainNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.7}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.5}
          toneMapped={false}
        />
      </mesh>
      <Text
        position={[0, size * 1.5, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

interface OrbitalData {
    category: string;
    percentage: number;
    color: string;
}

interface ThreeOrbitalViewProps {
    data: OrbitalData[];
}

// The component that gets scaled
function ScalableScene({ data }: ThreeOrbitalViewProps) {
  const groupRef = useRef<Group>(null!);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  const nodes = useMemo(() => {
    const numNodes = data.length;
    return data.map((item, index) => {
      const angle = (index / numNodes) * 2 * Math.PI;
      const radius = 2.0 + (index % 2) * 0.4; // Slightly larger base radius
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return {
        ...item,
        position: [x, 0, z] as [number, number, number],
        radius: radius,
      };
    });
  }, [data]);

  const centerNodePosition: [number, number, number] = [0, 0, 0];

  return (
    <group ref={groupRef}>
      <mesh position={centerNodePosition}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={2} toneMapped={false}/>
      </mesh>
      <Sparkles count={50} scale={2.5} size={10} speed={0.3} color="#fff" />

      {nodes.map((node) => (
        <group key={node.category}>
          <ChainNode
            position={node.position}
            color={node.color}
            label={`${node.category}: ${node.percentage}%`}
            size={0.25 + (node.percentage / 100) * 0.4}
          />
          <Line points={[centerNodePosition, node.position]} color={node.color} lineWidth={1} transparent opacity={0.3} />
        </group>
      ))}
    </group>
  );
}

function Scene({ data }: ThreeOrbitalViewProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0,0,0]} intensity={5} color="#00aaff" distance={10} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
      <Bounds fit clip observe margin={1.2}>
        <ScalableScene data={data} />
      </Bounds>
    </>
  );
}

export function ThreeOrbitalView({ data }: ThreeOrbitalViewProps) {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <Scene data={data} />
      </Canvas>
    </div>
  );
} 