'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
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
    if (meshRef.current) {
        meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.1}
          emissive={color}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
      <Text
        position={[0, size * 1.6, 0]}
        fontSize={0.5}
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

function Scene({ data }: ThreeOrbitalViewProps) {
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
      const radius = 5.0 + (index % 2) * 1.0;
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
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={centerNodePosition} intensity={12} color="#00aaff" distance={20} />

      <group ref={groupRef}>
        <mesh position={centerNodePosition}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={2.5} toneMapped={false}/>
        </mesh>

        {nodes.map((node) => (
          <group key={node.category}>
            <ChainNode
              position={node.position}
              color={node.color}
              label={`${node.category}: ${node.percentage}%`}
              size={0.7 + (node.percentage / 100) * 1.0}
            />
            <Line points={[centerNodePosition, node.position]} color={node.color} lineWidth={2} transparent opacity={0.5} />
          </group>
        ))}
      </group>
    </>
  );
}

export function ThreeOrbitalView({ data }: ThreeOrbitalViewProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas style={{ width: '100%', height: '100%' }}>
        <Scene data={data} />
      </Canvas>
    </div>
  );
}
