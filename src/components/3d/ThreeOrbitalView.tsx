'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Group } from 'three';

const ACCENT_COLOR = '#00ffff'; // Tactical Cyan

interface DataCubeProps {
  position: [number, number, number];
  size: number;
  label: string;
  percentage: number;
  highlighted: boolean;
}

const DataCube = ({ position, size, label, percentage, highlighted }: DataCubeProps) => {
  const cubeRef = useRef<Group>(null!);

  useFrame((state) => {
    if (cubeRef.current) {
      cubeRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={cubeRef} position={position}>
      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial
          color={highlighted ? '#ffffff' : ACCENT_COLOR}
          emissive={highlighted ? ACCENT_COLOR : '#000000'}
          emissiveIntensity={2}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={highlighted ? 1.0 : 0.7}
        />
      </mesh>
      <mesh>
        <boxGeometry args={[size * 1.05, size * 1.05, size * 1.05]} />
        <meshBasicMaterial color={ACCENT_COLOR} wireframe toneMapped={false} />
      </mesh>
      <Text
        position={[0, size * 1.2, 0]}
        fontSize={0.2}
        color={highlighted ? 'white' : ACCENT_COLOR}
        anchorX="center"
      >
        {`${label.toUpperCase()} ${percentage}%`}
      </Text>
    </group>
  );
};

interface ThreeOrbitalViewProps {
  data: Array<{
    category: string;
    percentage: number;
  }>;
}

export function ThreeOrbitalView({ data }: ThreeOrbitalViewProps) {
  const groupRef = useRef<Group>(null!);

  const nodes = useMemo(() => {
    const radius = 3;
    return data.map((item: { category: string; percentage: number }, index: number) => {
      const angle = (index / data.length) * 2 * Math.PI;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return { ...item, position: [x, 0.5, z] as [number, number, number] };
    });
  }, [data]);

  const centerNode: [number, number, number] = [0, 0.5, 0];

  return (
    <Canvas camera={{ position: [0, 5, 7], fov: 60 }} style={{ background: 'transparent' }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 5, 5]} intensity={1.5} color={ACCENT_COLOR} />

      <Grid
        infiniteGrid
        sectionColor={ACCENT_COLOR}
        sectionThickness={0.5}
        cellColor={'#444444'}
        cellThickness={0.5}
        fadeDistance={40}
      />

      <group ref={groupRef}>
        {/* Center Core */}
        <mesh position={centerNode}>
          <octahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial color={ACCENT_COLOR} emissive={ACCENT_COLOR} emissiveIntensity={1} metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Nodes and Links */}
        {nodes.map((node: any, i: number) => (
          <group key={i}>
            <DataCube
              position={node.position}
              size={0.4 + (node.percentage / 100) * 0.4}
              label={node.category}
              percentage={node.percentage}
              highlighted={false} // Add highlighting logic if needed
            />
            <Line points={[centerNode, node.position]} color={ACCENT_COLOR} lineWidth={1} dashed dashSize={0.2} gapSize={0.1} />
          </group>
        ))}
      </group>
    </Canvas>
  );
} 