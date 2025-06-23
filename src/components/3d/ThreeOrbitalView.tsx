'use client';

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Line, Bounds } from '@react-three/drei';
import * as THREE from 'three';
import { Group } from 'three';

interface ChainNodeProps {
    position: [number, number, number];
    color: string;
    label: string;
    size: number;
    hovered: boolean;
    selected: boolean;
    onPointerOver: () => void;
    onPointerOut: () => void;
    onClick: () => void;
}

const ChainNode = ({ position, color, label, size, hovered, selected, onPointerOver, onPointerOut, onClick }: ChainNodeProps) => (
  <group position={position}>
    <mesh
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
      scale={hovered || selected ? 1.18 : 1}
    >
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial
        color={color}
        metalness={0.95}
        roughness={0.12}
        emissive={color}
        emissiveIntensity={hovered || selected ? 0.8 : 0.3}
        toneMapped={false}
      />
    </mesh>
    {/* Glow effect */}
    {(hovered || selected) && (
      <mesh scale={1.35}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </mesh>
    )}
    <Text
      position={[0, size * 1.7, 0]}
      fontSize={0.32 + size * 0.18}
      color="#fff"
      anchorX="center"
      anchorY="middle"
      outlineColor="#111"
      outlineWidth={0.07}
      fontWeight={900}
      fillOpacity={hovered || selected ? 1 : 0.85}
    >
      {label}
    </Text>
  </group>
);

interface OrbitalData {
    category: string;
    percentage: number;
    color: string;
}

interface ThreeOrbitalViewProps {
    data: OrbitalData[];
}

function Tooltip({ position, children }: { position: [number, number, number]; children: React.ReactNode }) {
  // Project 3D position to 2D screen (handled by drei's Html, but let's use a simple div for now)
  // For a real app, use <Html /> from drei for perfect overlay.
  return (
    <group position={position}>
      <Text
        fontSize={0.32}
        color="#fff"
        anchorX="center"
        anchorY="bottom"
        outlineColor="#111"
        outlineWidth={0.08}
        fontWeight={900}
        fillOpacity={1}
        position={[0, 0.5, 0]}
      >
        {children}
      </Text>
    </group>
  );
}

function Scene({ data }: ThreeOrbitalViewProps) {
  const groupRef = useRef<Group>(null!);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  // Node sizing: min 0.38, max 0.85
  const nodes = useMemo(() => {
    const numNodes = data.length;
    return data.map((item, index) => {
      const angle = (index / numNodes) * 2 * Math.PI;
      const radius = 3.2 + (index % 2) * 0.8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Clamp node size for visual clarity
      const size = Math.max(0.38, Math.min(0.85, 0.38 + (item.percentage / 100) * 1.1));
      return {
        ...item,
        position: [x, 0, z] as [number, number, number],
        size,
      };
    });
  }, [data]);

  const centerNodePosition: [number, number, number] = [0, 0, 0];
  const centerSize = 1.1;

  return (
    <>
      {/* Soft background ring for depth */}
      <mesh position={[0, -centerSize * 1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 4.2, 64]} />
        <meshBasicMaterial color="#222" transparent opacity={0.13} />
      </mesh>
      <ambientLight intensity={0.9} />
      <pointLight position={[0, 2, 0]} intensity={2.2} color="#fff" distance={12} />
      <pointLight position={[0, 0, 0]} intensity={3.5} color="#00aaff" distance={8} />
      <group ref={groupRef}>
        <mesh position={centerNodePosition}>
          <sphereGeometry args={[centerSize, 32, 32]} />
          <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.9} toneMapped={false}/>
        </mesh>
        {nodes.map((node, i) => (
          <group key={node.category}>
            <ChainNode
              position={node.position}
              color={node.color}
              label={`${node.category} ${node.percentage}%`}
              size={node.size}
              hovered={hoveredIndex === i}
              selected={selectedIndex === i}
              onPointerOver={() => setHoveredIndex(i)}
              onPointerOut={() => setHoveredIndex(null)}
              onClick={() => setSelectedIndex(i)}
            />
            <Line points={[centerNodePosition, node.position]} color={node.color} lineWidth={hoveredIndex === i || selectedIndex === i ? 1.5 : 0.9} transparent opacity={hoveredIndex === i || selectedIndex === i ? 0.38 : 0.18} />
            {/* Tooltip on hover */}
            {hoveredIndex === i && (
              <Tooltip position={node.position}>
                {node.category}: {node.percentage}%
              </Tooltip>
            )}
          </group>
        ))}
      </group>
    </>
  );
}

export function ThreeOrbitalView({ data }: ThreeOrbitalViewProps) {
  return (
    <div style={{ width: '100%', height: '100%', cursor: 'pointer' }}>
      <Canvas style={{ width: '100%', height: '100%' }} dpr={[1, 2]}>
        <Bounds fit clip observe margin={0.5}>
          <Scene data={data} />
        </Bounds>
      </Canvas>
    </div>
  );
}
